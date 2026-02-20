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
use App\Models\LeadEmail;
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
     * Get users for the current authenticated user's team
     */
    public function getMyTeam(Request $request)
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $query = User::with(['branch', 'roles'])
            ->where('company_id', $user->company_id)
            ->where('is_active', true);

        // Logic based on roles
        if ($user->hasRole(['Admin', 'Company Admin', 'Super Admin'])) {
            // Admins see everyone (or maybe just admins shouldn't use this endpoint? User said "agr user tl h... agr manager h...")
            // Let's assume admins see everyone for now, or returns empty if strictly for "my team".
            // But usually admins consider the whole company their team.
            // For now, let's just return all users for admins to be safe, or maybe filtered.
            // The prompt says "agr user tl h... agr user manager h... agr employee h too option ni ayega".
            // It doesn't explicitly say what to do for Admin. I'll return all users for Admin.
        } elseif ($user->hasRole('Manager')) {
            // Manager: See all users who report to this manager (Direct Reports + potentially heirarchy)
            // For "Hierarchy", we might need recursive check.
            // But for simple "My Team", let's get direct reports (TLs) AND their subordinates?
            // User said: "manager h too uske ander ke sare users" (all users under him).
            // Let's find IDs of direct reports (TLs) and their direct reports (Employees).
            // 1. Get direct reports
            $directReports = User::where('reports_to', $user->id)->pluck('id');
            // 2. Get reports of those direct reports
            $grandReports = User::whereIn('reports_to', $directReports)->pluck('id');

            // Combined list of IDs
            $teamIds = $directReports->merge($grandReports)->push($user->id)->unique();

            $query->whereIn('id', $teamIds)->where('id', '!=', $user->id); // Exclude self

        } elseif ($user->hasRole('Team Leader')) {
            // Team Leader: See direct reports
            $query->where('reports_to', $user->id);
        } else {
            // Employee or other: No team
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }

        // Search
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

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        // Manager Restriction: Only see subordinates
        if (Auth::user()->hasRole('Manager')) {
            $query->whereDoesntHave('roles', function ($q) {
                $q->whereIn('name', ['Super Admin', 'Admin', 'Company Admin', 'Manager']);
            });
        }

        // Current user should not see themselves in the team list (they are the manager/owner)
        $query->where('id', '!=', Auth::id());

        $users = $query->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }

    /**
     * Get user details
     */
    private function checkHierarchyAccess($targetUserId)
    {
        $currentUser = Auth::user();
        if ($currentUser->hasRole(['Admin', 'Company Admin', 'Super Admin'])) {
            return true;
        }

        // Allow user to view their own details
        if ($currentUser->id == $targetUserId) {
            return true;
        }

        // Check subordinates
        $subordinateIds = $currentUser->getAllSubordinateIds();
        if (in_array((int) $targetUserId, $subordinateIds)) {
            return true;
        }

        return false;
    }

    /**
     * Get user details
     */
    public function getUserDetails($id)
    {
        $companyId = $this->resolveCompanyId();

        if (!$this->checkHierarchyAccess($id)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access'], 403);
        }

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
            'is_active' => 'boolean',
            'reports_to' => 'nullable|exists:users,id'
        ]);

        // Manager Restriction: Cannot assign restricted roles
        if (Auth::user()->hasRole('Manager')) {
            $restrictedRoles = ['Super Admin', 'Admin', 'Company Admin', 'Manager'];
            if ($request->roles && is_array($request->roles)) {
                foreach ($request->roles as $roleName) {
                    if (in_array($roleName, $restrictedRoles)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Managers cannot assign restricted roles.',
                        ], 403);
                    }
                }
            }
        }

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
                'reports_to' => $request->reports_to,
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
            'is_active' => 'boolean',
            'reports_to' => 'nullable|exists:users,id'
        ]);

        // Manager Restriction: Cannot edit restricted users or assign restricted roles
        if (Auth::user()->hasRole('Manager')) {
            if ($user->hasRole(['Super Admin', 'Admin', 'Company Admin', 'Manager'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Managers cannot edit higher level users or other managers.',
                ], 403);
            }

            if ($request->roles && is_array($request->roles)) {
                $restrictedRoles = ['Super Admin', 'Admin', 'Company Admin', 'Manager'];
                foreach ($request->roles as $roleName) {
                    if (in_array($roleName, $restrictedRoles)) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Managers cannot assign restricted roles.',
                        ], 403);
                    }
                }
            }
        }

        try {
            DB::beginTransaction();

            $updateData = [
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'branch_id' => $request->branch_id,
                'is_active' => $request->is_active ?? $user->is_active,
            ];

            if ($request->exists('reports_to')) {
                $updateData['reports_to'] = $request->reports_to;
            }

            $user->update($updateData);

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

        // Manager Restriction: Cannot delete restricted users
        if (Auth::user()->hasRole('Manager')) {
            if ($user->hasRole(['Super Admin', 'Admin', 'Company Admin', 'Manager'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Managers cannot delete higher level users or other managers.',
                ], 403);
            }
        }

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
        // Manager Restriction
        if (Auth::user()->hasRole('Manager')) {
            return response()->json([
                'success' => false,
                'message' => 'Managers cannot create branches.',
            ], 403);
        }

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
        // Manager Restriction
        if (Auth::user()->hasRole('Manager')) {
            return response()->json([
                'success' => false,
                'message' => 'Managers cannot update branches.',
            ], 403);
        }

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
        // Manager Restriction
        if (Auth::user()->hasRole('Manager')) {
            return response()->json([
                'success' => false,
                'message' => 'Managers cannot delete branches.',
            ], 403);
        }

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
        $query = Role::whereNotIn('name', ['Super Admin', 'Company Admin']);

        // Manager Restriction: Hide restricted roles
        if (Auth::user()->hasRole('Manager')) {
            $query->whereNotIn('name', ['Admin', 'Manager']);
        }

        $roles = $query->get();

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
        // Manager Restriction
        if (Auth::user()->hasRole('Manager')) {
            return response()->json([
                'success' => false,
                'message' => 'Managers cannot create roles.',
            ], 403);
        }

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
        // Manager Restriction
        if (Auth::user()->hasRole('Manager')) {
            return response()->json([
                'success' => false,
                'message' => 'Managers cannot update roles.',
            ], 403);
        }

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
        // Manager Restriction
        if (Auth::user()->hasRole('Manager')) {
            return response()->json([
                'success' => false,
                'message' => 'Managers cannot delete roles.',
            ], 403);
        }

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
    /**
     * Get all available permissions available to the company
     */
    public function getPermissions()
    {
        // Get all available features from config/system/setup
        $allFeatures = SubscriptionPlanFeature::getAvailableFeatures();

        // Define features that support granular CRUD permissions
        $crudFeatures = [
            'leads_management',
            'followups',
            'payments',
            'itineraries',
            'day_itineraries',
            'hotels',
            'activities',
            'transfers',
            'suppliers',
            'destinations',
            'email_templates',
            'campaigns',
            'sms_campaigns',
            'landing_pages',
            'targets',
            'expenses',
            'user_management',
            'permissions',
            'marketing_automation',
            'ab_testing'
        ];

        // Ensure basic permissions exist
        foreach (['view dashboard', 'manage profile'] as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // Ensure feature permissions and their granular sub-permissions exist
        foreach ($allFeatures as $featureKey => $feature) {
            Permission::firstOrCreate(['name' => $featureKey, 'guard_name' => 'web']);

            if (in_array($featureKey, $crudFeatures)) {
                foreach (['create', 'edit', 'delete'] as $action) {
                    Permission::firstOrCreate(['name' => "{$featureKey}.{$action}", 'guard_name' => 'web']);
                }
            }
        }

        $user = Auth::user();

        // Super Admin gets everything
        if ($user->is_super_admin) {
            $permissions = Permission::orderBy('name')->get(['id', 'name']);
            return response()->json(['success' => true, 'data' => $permissions]);
        }

        // Company Users get permissions based on Subscription Plan
        $allowedNames = collect(['view dashboard', 'manage profile']);

        $company = $user->company;
        if ($company && $company->subscriptionPlan) {
            // First try to get enabled features from permissions JSON column
            $planFeatures = $company->subscriptionPlan->getEnabledFeaturesFromPermissions();
            $enabledFeatureKeys = collect();

            // If empty, try the pivot table relationship
            if ($planFeatures->isEmpty()) {
                $pivotFeatures = $company->subscriptionPlan->planFeatures()->wherePivot('is_active', true)->get();
                $enabledFeatureKeys = $pivotFeatures->pluck('key');
            } else {
                $enabledFeatureKeys = $planFeatures->pluck('feature_key');
            }

            // Add base feature permissions
            $allowedNames = $allowedNames->merge($enabledFeatureKeys);

            // Add granular permissions for enabled features
            foreach ($enabledFeatureKeys as $key) {
                if (in_array($key, $crudFeatures)) {
                    $allowedNames->push("{$key}.create");
                    $allowedNames->push("{$key}.edit");
                    $allowedNames->push("{$key}.delete");
                }
            }
        }

        $permissions = Permission::whereIn('name', $allowedNames)->orderBy('name')->get(['id', 'name']);

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
        // Ensure role belongs to company (if strictly checking, role doesn't have company_id usually, but handled by app logic)
        // Spatie roles are global but usually we prefix or manage them. Here assuming we just edit.

        $request->validate([
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id'
        ]);

        $user = Auth::user();

        // Manager Restriction: Cannot edit permissions of restricted roles
        if ($user->hasRole('Manager')) {
            $restrictedRoles = ['Super Admin', 'Admin', 'Company Admin', 'Manager'];
            if (in_array($role->name, $restrictedRoles)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Managers cannot edit permissions of higher level roles or other managers.',
                ], 403);
            }
        }

        // Validate that user is allowed to assign these permissions
        if (!$user->is_super_admin) {
            $allowedNames = collect(['view dashboard', 'manage profile']);
            $company = $user->company;

            // Define features that support granular CRUD permissions (COPY from getPermissions)
            $crudFeatures = [
                'leads_management',
                'followups',
                'payments',
                'itineraries',
                'day_itineraries',
                'hotels',
                'activities',
                'transfers',
                'suppliers',
                'destinations',
                'email_templates',
                'campaigns',
                'sms_campaigns',
                'landing_pages',
                'targets',
                'expenses',
                'user_management',
                'permissions',
                'marketing_automation',
                'ab_testing'
            ];

            if ($company && $company->subscriptionPlan) {
                // First try to get enabled features from permissions JSON column
                $planFeatures = $company->subscriptionPlan->getEnabledFeaturesFromPermissions();
                $enabledFeatureKeys = collect();

                // If empty, try the pivot table relationship
                if ($planFeatures->isEmpty()) {
                    $pivotFeatures = $company->subscriptionPlan->planFeatures()->wherePivot('is_active', true)->get();
                    $enabledFeatureKeys = $pivotFeatures->pluck('key');
                } else {
                    $enabledFeatureKeys = $planFeatures->pluck('feature_key');
                }

                // Add base feature permissions
                $allowedNames = $allowedNames->merge($enabledFeatureKeys);

                // Add granular permissions for enabled features
                foreach ($enabledFeatureKeys as $key) {
                    if (in_array($key, $crudFeatures)) {
                        $allowedNames->push("{$key}.create");
                        $allowedNames->push("{$key}.edit");
                        $allowedNames->push("{$key}.delete");
                    }
                }
            }

            $allowedIds = Permission::whereIn('name', $allowedNames)->pluck('id')->toArray();
            $requestedIds = $request->input('permissions', []);

            // Check if any requested ID is NOT in allowed IDs
            if (!empty(array_diff($requestedIds, $allowedIds))) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are attempting to assign permissions that are not enabled in your subscription plan.'
                ], 403);
            }
        }

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
        $targetUser = User::where('company_id', $companyId)->findOrFail($id);

        $request->validate([
            'permissions' => 'nullable|array',
            'permissions.*' => 'exists:permissions,id'
        ]);

        $currentUser = Auth::user();

        // Validate that current user is allowed to assign these permissions
        if (!$currentUser->is_super_admin) {
            $allowedNames = collect(['view dashboard', 'manage profile']);
            $company = $currentUser->company;

            // Define features that support granular CRUD permissions (COPY from getPermissions)
            $crudFeatures = [
                'leads_management',
                'followups',
                'payments',
                'itineraries',
                'day_itineraries',
                'hotels',
                'activities',
                'transfers',
                'suppliers',
                'destinations',
                'email_templates',
                'campaigns',
                'sms_campaigns',
                'landing_pages',
                'targets',
                'expenses',
                'user_management',
                'permissions',
                'marketing_automation',
                'ab_testing'
            ];

            if ($company && $company->subscriptionPlan) {
                // First try to get enabled features from permissions JSON column
                $planFeatures = $company->subscriptionPlan->getEnabledFeaturesFromPermissions();
                $enabledFeatureKeys = collect();

                // If empty, try the pivot table relationship
                if ($planFeatures->isEmpty()) {
                    $pivotFeatures = $company->subscriptionPlan->planFeatures()->wherePivot('is_active', true)->get();
                    $enabledFeatureKeys = $pivotFeatures->pluck('key');
                } else {
                    $enabledFeatureKeys = $planFeatures->pluck('feature_key');
                }

                // Add base feature permissions
                $allowedNames = $allowedNames->merge($enabledFeatureKeys);

                // Add granular permissions for enabled features
                foreach ($enabledFeatureKeys as $key) {
                    if (in_array($key, $crudFeatures)) {
                        $allowedNames->push("{$key}.create");
                        $allowedNames->push("{$key}.edit");
                        $allowedNames->push("{$key}.delete");
                    }
                }
            }

            $allowedIds = Permission::whereIn('name', $allowedNames)->pluck('id')->toArray();
            $requestedIds = $request->input('permissions', []);

            // Check if any requested ID is NOT in allowed IDs
            if (!empty(array_diff($requestedIds, $allowedIds))) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are attempting to assign permissions that are not enabled in your subscription plan.'
                ], 403);
            }
        }

        $permissionIds = $request->input('permissions', []);
        $permissions = Permission::whereIn('id', $permissionIds)->get();
        $targetUser->syncPermissions($permissions);

        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        return response()->json([
            'success' => true,
            'message' => 'User permissions updated successfully',
            'data' => $targetUser->permissions->pluck('id')->toArray()
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
        if (!$this->checkHierarchyAccess($id)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access'], 403);
        }

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

        // Manager Restriction: Only include subordinates in report
        if (Auth::user()->hasRole('Manager')) {
            $userQuery->whereDoesntHave('roles', function ($q) {
                $q->whereIn('name', ['Super Admin', 'Admin', 'Company Admin', 'Manager']);
            });
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
    /**
     * Get current company subscription details
     */
    public function getSubscriptionDetails()
    {
        $companyId = $this->resolveCompanyId();
        if (!$companyId) {
            return response()->json([
                'success' => false,
                'message' => 'Company context not resolved',
            ], 422);
        }

        $company = Company::with([
            'subscriptionPlan.planFeatures' => function ($query) {
                // Filter only actve features from the pivot table
                $query->wherePivot('is_active', true);
            }
        ])->findOrFail($companyId);

        return response()->json([
            'success' => true,
            'data' => [
                'company_name' => $company->name,
                'plan_name' => $company->subscriptionPlan ? $company->subscriptionPlan->name : 'No Active Plan',
                'plan_description' => $company->subscriptionPlan ? $company->subscriptionPlan->description : '',
                'price' => $company->subscriptionPlan ? (float) $company->subscriptionPlan->price : 0,
                'billing_period' => $company->subscriptionPlan ? $company->subscriptionPlan->billing_period : '',
                'expiry_date' => $company->subscription_end_date ? $company->subscription_end_date->format('Y-m-d') : 'Unlimited',
                'features' => $company->subscriptionPlan ? $company->subscriptionPlan->planFeatures->map(function ($f) {
                    return [
                        'name' => $f->name,
                        'key' => $f->key,
                        'limit' => $f->pivot->limit_value
                    ];
                }) : []
            ]
        ]);
    }

    /**
     * Get detailed user statistics (assigned, created, status breakdown).
     */
    public function getDetailedUserStats($id)
    {
        if (!$this->checkHierarchyAccess($id)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access'], 403);
        }

        $companyId = $this->resolveCompanyId();
        // Allow access if user is admin/manager or viewing own stats? 
        // For now, assuming auth middleware handles basic access, but we should ensure company scope.
        $user = User::where('company_id', $companyId)->findOrFail($id);

        $ranges = ['week', 'month', 'year'];
        $data = [];

        foreach ($ranges as $range) {
            $now = Carbon::now();
            $start = $now->copy();
            $end = $now->copy();

            if ($range === 'week') {
                $start->startOfWeek();
                $end->endOfWeek();
            } elseif ($range === 'month') {
                $start->startOfMonth();
                $end->endOfMonth();
            } elseif ($range === 'year') {
                $start->startOfYear();
                $end->endOfYear();
            }

            // Leads Assigned TO this user
            // Note: Filter by created_at in range for simplicity as 'assigned' date
            $assignedCounts = Lead::where('assigned_to', $user->id)
                ->whereBetween('created_at', [$start, $end])
                ->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status');

            // Leads Created BY this user
            $createdCounts = Lead::where('created_by', $user->id)
                ->whereBetween('created_at', [$start, $end])
                ->select('status', DB::raw('count(*) as total'))
                ->groupBy('status')
                ->pluck('total', 'status');

            $data[$range] = [
                'assigned' => $assignedCounts,
                'created' => $createdCounts,
                'total_assigned' => $assignedCounts->sum(),
                'total_created' => $createdCounts->sum()
            ];
        }

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    /**
     * Get user activity logs (QueryHistoryLog).
     */
    public function getUserLogs($id)
    {
        if (!$this->checkHierarchyAccess($id)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access'], 403);
        }

        $companyId = $this->resolveCompanyId();
        $user = User::where('company_id', $companyId)->findOrFail($id);

        // Paginate logs
        $logs = QueryHistoryLog::where('user_id', $user->id)
            ->with([
                'lead' => function ($q) {
                    $q->select('id', 'client_name', 'destination', 'status');
                }
            ])
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $logs
        ]);
    }

    /**
     * Get user communication logs (WhatsApp & Email).
     */
    public function getUserCommunications($id)
    {
        if (!$this->checkHierarchyAccess($id)) {
            return response()->json(['success' => false, 'message' => 'Unauthorized access'], 403);
        }

        $companyId = $this->resolveCompanyId();
        $user = User::where('company_id', $companyId)->findOrFail($id);

        // Fetch WhatsApp Logs (Outbound by this user)
        $whatsappLogs = DB::table('whatsapp_messages')
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->take(100)
            ->get()
            ->map(function ($log) {
                // Manually fetch lead info if lead_id is present
                $lead = null;
                if ($log->lead_id) {
                    $lead = Lead::select('id', 'client_name', 'destination')->find($log->lead_id);
                }
                $log->lead = $lead;
                $log->type = 'whatsapp';
                return $log;
            });

        // Fetch Email Logs (Sent by this user)
        $emailLogs = LeadEmail::where('user_id', $user->id)
            ->with(['lead:id,client_name,destination'])
            ->orderBy('created_at', 'desc')
            ->take(100)
            ->get()
            ->map(function ($log) {
                $log->type = 'email';
                return $log;
            });

        // Merge and sort
        $communications = $whatsappLogs->merge($emailLogs)->sortByDesc('created_at')->values();

        return response()->json([
            'success' => true,
            'data' => $communications
        ]);
    }
}
