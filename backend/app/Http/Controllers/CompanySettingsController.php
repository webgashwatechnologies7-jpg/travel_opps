<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Branch;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use App\Models\SubscriptionPlanFeature;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Leads\Domain\Entities\LeadFollowup;
use App\Modules\Leads\Domain\Entities\LeadStatusLog;
use App\Models\QueryHistoryLog;
use Carbon\Carbon;

class CompanySettingsController extends Controller
{
    private function resolveCompanyId(): ?int
    {
        $companyId = Auth::user()?->company_id;
        if ($companyId) {
            return (int) $companyId;
        }

        if (function_exists('tenant')) {
            $tenantId = tenant('id');
            if ($tenantId) {
                return (int) $tenantId;
            }
        }

        return null;
    }

    private function buildUserPerformanceRange(User $user, Carbon $startDate, Carbon $endDate): array
    {
        $assignedLogs = LeadStatusLog::where('new_status', 'assigned')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereHas('lead', function ($query) use ($user) {
                $query->where('assigned_to', $user->id)
                    ->where('company_id', $user->company_id);
            });

        $assignedLeadIds = (clone $assignedLogs)->pluck('lead_id')->unique()->values();

        $assignedBy = (clone $assignedLogs)
            ->select('changed_by', DB::raw('COUNT(DISTINCT lead_id) as assigned_count'))
            ->groupBy('changed_by')
            ->get();

        $assignedByUsers = User::whereIn('id', $assignedBy->pluck('changed_by')->filter())
            ->get(['id', 'name']);

        $assignedByBreakdown = $assignedBy->map(function ($row) use ($assignedByUsers) {
            $userInfo = $assignedByUsers->firstWhere('id', $row->changed_by);
            return [
                'user_id' => $row->changed_by,
                'name' => $userInfo?->name ?? 'Unknown',
                'count' => (int) $row->assigned_count,
            ];
        })->values();

        $assignedOutCount = LeadStatusLog::where('new_status', 'assigned')
            ->where('changed_by', $user->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->distinct('lead_id')
            ->count('lead_id');

        $followupLeadIds = LeadFollowup::where('user_id', $user->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->pluck('lead_id')
            ->unique()
            ->values();

        $callLogs = QueryHistoryLog::where('user_id', $user->id)
            ->where('activity_type', 'call')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with('lead:id,client_name,phone')
            ->orderByDesc('created_at');

        $callLeadIds = (clone $callLogs)->pluck('lead_id')->unique()->values();

        $contactedLeadIds = $followupLeadIds->merge($callLeadIds)->unique()->values();

        $confirmedCount = LeadStatusLog::where('new_status', 'confirmed')
            ->where('changed_by', $user->id)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->distinct('lead_id')
            ->count('lead_id');

        $recentCalls = $callLogs->limit(50)->get()->map(function ($log) {
            $metadata = $log->metadata ?? [];
            return [
                'id' => $log->id,
                'lead_id' => $log->lead_id,
                'lead_name' => $log->lead?->client_name,
                'lead_phone' => $log->lead?->phone,
                'description' => $log->activity_description,
                'duration_seconds' => $metadata['duration_seconds'] ?? null,
                'call_status' => $metadata['call_status'] ?? null,
                'recording_url' => $metadata['recording_url'] ?? null,
                'created_at' => $log->created_at,
            ];
        });

        return [
            'assigned_to_user' => $assignedLeadIds->count(),
            'assigned_by_user' => $assignedOutCount,
            'assigned_by_breakdown' => $assignedByBreakdown,
            'contacted_leads' => $contactedLeadIds->count(),
            'followups_count' => $followupLeadIds->count(),
            'calls_count' => $callLeadIds->count(),
            'confirmed_by_user' => $confirmedCount,
            'recent_calls' => $recentCalls,
        ];
    }

    private function buildTeamReportRange(array $userIds, Carbon $startDate, Carbon $endDate): array
    {
        if (empty($userIds)) {
            return [
                'assigned_to_team' => 0,
                'assigned_by_team' => 0,
                'contacted_leads' => 0,
                'followups_count' => 0,
                'calls_count' => 0,
                'confirmed_by_team' => 0,
                'per_user' => [],
            ];
        }

        $assignedToTeam = LeadStatusLog::where('new_status', 'assigned')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereHas('lead', function ($query) use ($userIds) {
                $query->whereIn('assigned_to', $userIds);
            })
            ->distinct('lead_id')
            ->count('lead_id');

        $assignedByTeam = LeadStatusLog::where('new_status', 'assigned')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('changed_by', $userIds)
            ->distinct('lead_id')
            ->count('lead_id');

        $followupLeadIds = LeadFollowup::whereIn('user_id', $userIds)
            ->whereBetween('created_at', [$startDate, $endDate])
            ->pluck('lead_id')
            ->unique();

        $callLeadIds = QueryHistoryLog::whereIn('user_id', $userIds)
            ->where('activity_type', 'call')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->pluck('lead_id')
            ->unique();

        $contactedLeadIds = $followupLeadIds->merge($callLeadIds)->unique();

        $confirmedByTeam = LeadStatusLog::where('new_status', 'confirmed')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->whereIn('changed_by', $userIds)
            ->distinct('lead_id')
            ->count('lead_id');

        $users = User::whereIn('id', $userIds)->get(['id', 'name', 'email']);

        $perUser = $users->map(function ($user) use ($startDate, $endDate) {
            $assignedToUser = LeadStatusLog::where('new_status', 'assigned')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->whereHas('lead', function ($query) use ($user) {
                    $query->where('assigned_to', $user->id);
                })
                ->distinct('lead_id')
                ->count('lead_id');

            $contactedLeadIds = LeadFollowup::where('user_id', $user->id)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->pluck('lead_id')
                ->merge(
                    QueryHistoryLog::where('user_id', $user->id)
                        ->where('activity_type', 'call')
                        ->whereBetween('created_at', [$startDate, $endDate])
                        ->pluck('lead_id')
                )
                ->unique();

            $confirmedByUser = LeadStatusLog::where('new_status', 'confirmed')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->where('changed_by', $user->id)
                ->distinct('lead_id')
                ->count('lead_id');

            return [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'assigned_to_user' => $assignedToUser,
                'contacted_leads' => $contactedLeadIds->count(),
                'confirmed_by_user' => $confirmedByUser,
            ];
        })->values();

        return [
            'assigned_to_team' => $assignedToTeam,
            'assigned_by_team' => $assignedByTeam,
            'contacted_leads' => $contactedLeadIds->count(),
            'followups_count' => $followupLeadIds->count(),
            'calls_count' => $callLeadIds->count(),
            'confirmed_by_team' => $confirmedByTeam,
            'per_user' => $perUser,
        ];
    }

    public function __construct()
    {
        $this->middleware('auth:sanctum');
        // Temporarily remove permission middleware to fix 403 error
        // TODO: Add proper permission checking after user permissions are set up
        /*
        $this->middleware('permission:manage_company_settings')->only([
            'getUsers', 'getUserDetails', 'createUser', 'updateUser', 'deleteUser',
            'getBranches', 'createBranch', 'updateBranch', 'deleteBranch',
            'getRoles', 'createRole', 'updateRole', 'deleteRole',
            'getStats'
        ]);
        */
    }

    /**
     * Get company users
     */
    public function getUsers(Request $request)
    {
        $companyId = $this->resolveCompanyId();
        if (!$companyId) {
            return response()->json([
                'success' => false,
                'message' => 'Company context not resolved',
            ], 422);
        }
        $query = User::with(['branch', 'roles'])
            ->where('company_id', $companyId)
            ->where('is_super_admin', false);

        // Filter by branch if provided
        if ($request->branch_id) {
            $query->where('branch_id', $request->branch_id);
        }

        // Filter by status if provided
        if ($request->is_active !== null) {
            $query->where('is_active', $request->is_active);
        }

        // Search by name or email
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $users = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Get user details
     */
    public function getUserDetails($id)
    {
        $companyId = $this->resolveCompanyId();
        $user = User::with(['branch', 'roles'])
            ->where('company_id', $companyId)
            ->where('is_super_admin', false)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /**
     * Create a new user
     */
    public function createUser(Request $request)
    {
        $companyId = $this->resolveCompanyId();
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,NULL,id,company_id,' . $companyId,
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'branch_id' => 'nullable|exists:branches,id,company_id,' . $companyId,
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,name',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'company_id' => $companyId,
                'branch_id' => $request->branch_id,
                'is_active' => $request->is_active ?? true,
                'employee_id' => $request->employee_id,
            ]);

            // Assign roles if provided
            if ($request->roles) {
                $user->syncRoles($request->roles);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => $user->load(['branch', 'roles'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a user
     */
    public function updateUser(Request $request, $id)
    {
        $companyId = $this->resolveCompanyId();
        $user = User::where('company_id', $companyId)
            ->where('is_super_admin', false)
            ->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id . ',id,company_id,' . $companyId,
            'phone' => 'nullable|string|max:20',
            'branch_id' => 'nullable|exists:branches,id,company_id,' . $companyId,
            'roles' => 'nullable|array',
            'roles.*' => 'exists:roles,name',
            'is_active' => 'boolean'
        ]);

        try {
            DB::beginTransaction();

            $user->update([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'branch_id' => $request->branch_id,
                'is_active' => $request->is_active ?? $user->is_active,
            ]);

            // Update password if provided
            if ($request->password) {
                $user->update([
                    'password' => Hash::make($request->password)
                ]);
            }

            // Update roles if provided
            if ($request->roles !== null) {
                $user->syncRoles($request->roles);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => $user->load(['branch', 'roles'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a user
     */
    public function deleteUser($id)
    {
        $companyId = $this->resolveCompanyId();
        $user = User::where('company_id', $companyId)
            ->where('is_super_admin', false)
            ->findOrFail($id);

        // Prevent deletion of self
        if ($user->id === Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account'
            ], 400);
        }

        try {
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get company branches
     */
    public function getBranches(Request $request)
    {
        $companyId = $this->resolveCompanyId();
        $query = Branch::where('company_id', $companyId);

        // Filter by status if provided
        if ($request->is_active !== null) {
            $query->where('is_active', $request->is_active);
        }

        // Search by name or code
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('code', 'like', '%' . $request->search . '%');
            });
        }

        $branches = $query->withCount('users')->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $branches
        ]);
    }

    /**
     * Create a new branch
     */
    public function createBranch(Request $request)
    {
        $companyId = $this->resolveCompanyId();
        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'is_active' => 'boolean'
        ]);

        try {
            $code = strtoupper(substr(preg_replace('/[^A-Za-z0-9]/', '', (string) $request->name), 0, 6));
            if ($code === '') {
                $code = 'BR' . random_int(100, 999);
            }

            $branch = Branch::create([
                'company_id' => $companyId,
                'name' => $request->name,
                'code' => $code,
                'address' => $request->address,
                'phone' => $request->phone,
                'email' => $request->email,
                'city' => $request->city,
                'state' => $request->state,
                'country' => $request->country,
                'postal_code' => $request->postal_code,
                'is_active' => $request->is_active ?? true,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Branch created successfully',
                'data' => $branch->loadCount('users')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create branch: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a branch
     */
    public function updateBranch(Request $request, $id)
    {
        $companyId = $this->resolveCompanyId();
        $branch = Branch::where('company_id', $companyId)->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string',
            'phone' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:255',
            'city' => 'nullable|string|max:100',
            'state' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'is_active' => 'boolean'
        ]);

        try {
            $branch->update([
                'name' => $request->name,
                'address' => $request->address,
                'phone' => $request->phone,
                'email' => $request->email,
                'city' => $request->city,
                'state' => $request->state,
                'country' => $request->country,
                'postal_code' => $request->postal_code,
                'is_active' => $request->is_active ?? $branch->is_active,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Branch updated successfully',
                'data' => $branch->loadCount('users')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update branch: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a branch
     */
    public function deleteBranch($id)
    {
        $companyId = $this->resolveCompanyId();
        $branch = Branch::where('company_id', $companyId)->findOrFail($id);

        // Check if branch has users
        if ($branch->users()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete branch with assigned users. Please reassign users first.'
            ], 400);
        }

        try {
            $branch->delete();

            return response()->json([
                'success' => true,
                'message' => 'Branch deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete branch: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get available roles
     */
    public function getRoles()
    {
        $roles = Role::where('name', '!=', 'Super Admin')->get();

        return response()->json([
            'success' => true,
            'data' => $roles
        ]);
    }

    /**
     * Create a new role
     */
    public function createRole(Request $request)
    {
        // Debug: Log the incoming request
        \Log::info('Role creation request:', $request->all());
        
        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string'
        ]);

        try {
            $role = Role::create([
                'name' => $request->name,
                'guard_name' => 'web'
            ]);

            // Assign permissions to role
            if ($request->permissions && is_array($request->permissions)) {
                // Get permission models from names
                $permissionModels = \Spatie\Permission\Models\Permission::whereIn('name', $request->permissions)->get();
                $role->syncPermissions($permissionModels);
            }

            return response()->json([
                'success' => true,
                'message' => 'Role created successfully',
                'data' => $role->load('permissions')
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a role
     */
    public function updateRole(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,' . $id,
            'permissions' => 'nullable|array',
            'permissions.*' => 'string'
        ]);

        try {
            $role->update([
                'name' => $request->name
            ]);

            // Update permissions
            if ($request->permissions !== null) {
                // Get permission models from names
                $permissionModels = \Spatie\Permission\Models\Permission::whereIn('name', $request->permissions)->get();
                $role->syncPermissions($permissionModels);
            }

            return response()->json([
                'success' => true,
                'message' => 'Role updated successfully',
                'data' => $role->load('permissions')
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a role
     */
    public function deleteRole($id)
    {
        $role = Role::findOrFail($id);

        try {
            $role->delete();

            return response()->json([
                'success' => true,
                'message' => 'Role deleted successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete role: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all available permissions
     */
    public function getPermissions()
    {
        if (Permission::count() === 0) {
            $features = SubscriptionPlanFeature::getAvailableFeatures();
            foreach ($features as $featureKey => $feature) {
                Permission::firstOrCreate([
                    'name' => $feature['name'] ?? $featureKey,
                    'guard_name' => 'web',
                ]);
            }
        }

        $permissions = Permission::orderBy('name')->get(['id', 'name']);

        return response()->json([
            'success' => true,
            'data' => $permissions
        ]);
    }

    /**
     * Get permissions for a specific role
     */
    public function getRolePermissions($id)
    {
        $role = Role::findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $role->permissions->pluck('id')->toArray()
        ]);
    }

    /**
     * Update permissions for a role
     */
    public function updateRolePermissions(Request $request, $id)
    {
        $role = Role::findOrFail($id);

        $request->validate([
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id'
        ]);

        $permissionIds = $request->input('permissions', []);
        $permissions = Permission::whereIn('id', $permissionIds)->get();
        $role->syncPermissions($permissions);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'success' => true,
            'message' => 'Role permissions updated successfully',
            'data' => $role->permissions->pluck('id')->toArray()
        ]);
    }

    /**
     * Get permissions for a specific user
     */
    public function getUserPermissions($id)
    {
        $companyId = $this->resolveCompanyId();
        $user = User::where('company_id', $companyId)->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $user->permissions->pluck('id')->toArray()
        ]);
    }

    /**
     * Update permissions for a specific user
     */
    public function updateUserPermissions(Request $request, $id)
    {
        $companyId = $this->resolveCompanyId();
        $user = User::where('company_id', $companyId)->findOrFail($id);

        $request->validate([
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id'
        ]);

        $permissionIds = $request->input('permissions', []);
        $permissions = Permission::whereIn('id', $permissionIds)->get();
        $user->syncPermissions($permissions);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'success' => true,
            'message' => 'User permissions updated successfully',
            'data' => $user->permissions->pluck('id')->toArray()
        ]);
    }

    /**
     * Get company statistics
     */
    public function getStats()
    {
        $companyId = $this->resolveCompanyId();

        $stats = [
            'total_users' => User::where('company_id', $companyId)->where('is_super_admin', false)->count(),
            'active_users' => User::where('company_id', $companyId)->where('is_super_admin', false)->where('is_active', true)->count(),
            'total_branches' => Branch::where('company_id', $companyId)->count(),
            'active_branches' => Branch::where('company_id', $companyId)->where('is_active', true)->count(),
            'users_by_branch' => Branch::where('company_id', $companyId)
                ->withCount('users')
                ->get()
                ->map(function ($branch) {
                    return [
                        'branch_name' => $branch->name,
                        'users_count' => $branch->users_count
                    ];
                })
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }

    /**
     * Get detailed performance stats for a specific user.
     */
    public function getUserPerformance(Request $request, $id)
    {
        $companyId = $this->resolveCompanyId();
        $user = User::where('company_id', $companyId)
            ->where('is_super_admin', false)
            ->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'range' => 'nullable|in:week,month,year',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $now = Carbon::now();
        $weekStart = $now->copy()->startOfWeek();
        $monthStart = $now->copy()->startOfMonth();
        $yearStart = $now->copy()->startOfYear();

        $data = [
            'week' => $this->buildUserPerformanceRange($user, $weekStart, $now),
            'month' => $this->buildUserPerformanceRange($user, $monthStart, $now),
            'year' => $this->buildUserPerformanceRange($user, $yearStart, $now),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'user_id' => $user->id,
                'ranges' => $data,
            ],
        ]);
    }

    /**
     * Get performance report for a team (branch).
     */
    public function getTeamReport(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'branch_id' => 'nullable|integer|exists:branches,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $branchId = $request->input('branch_id');
        $companyId = $this->resolveCompanyId();

        $branch = null;
        if ($branchId) {
            $branch = Branch::where('company_id', $companyId)->findOrFail($branchId);
        }

        $userQuery = User::where('company_id', $companyId)->where('is_super_admin', false);
        if ($branch) {
            $userQuery->where('branch_id', $branch->id);
        }

        $userIds = $userQuery->pluck('id')->all();

        $now = Carbon::now();
        $weekStart = $now->copy()->startOfWeek();
        $monthStart = $now->copy()->startOfMonth();
        $yearStart = $now->copy()->startOfYear();

        $ranges = [
            'week' => $this->buildTeamReportRange($userIds, $weekStart, $now),
            'month' => $this->buildTeamReportRange($userIds, $monthStart, $now),
            'year' => $this->buildTeamReportRange($userIds, $yearStart, $now),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'branch' => $branch ? [
                    'id' => $branch->id,
                    'name' => $branch->name,
                ] : null,
                'ranges' => $ranges,
            ],
        ]);
    }
}
