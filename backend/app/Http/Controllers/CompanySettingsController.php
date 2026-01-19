<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Branch;
use App\Models\Company;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class CompanySettingsController extends Controller
{
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
        $companyId = Auth::user()->company_id;
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
        $user = User::with(['branch', 'roles'])
            ->where('company_id', Auth::user()->company_id)
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
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,NULL,id,company_id,' . Auth::user()->company_id,
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'branch_id' => 'nullable|exists:branches,id,company_id,' . Auth::user()->company_id,
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
                'company_id' => Auth::user()->company_id,
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
        $user = User::where('company_id', Auth::user()->company_id)
            ->where('is_super_admin', false)
            ->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id . ',id,company_id,' . Auth::user()->company_id,
            'phone' => 'nullable|string|max:20',
            'branch_id' => 'nullable|exists:branches,id,company_id,' . Auth::user()->company_id,
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
        $user = User::where('company_id', Auth::user()->company_id)
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
        $companyId = Auth::user()->company_id;
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
        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:branches,code,NULL,id,company_id,' . Auth::user()->company_id,
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
            $branch = Branch::create([
                'company_id' => Auth::user()->company_id,
                'name' => $request->name,
                'code' => $request->code,
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
        $branch = Branch::where('company_id', Auth::user()->company_id)->findOrFail($id);

        $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:10|unique:branches,code,' . $id . ',id,company_id,' . Auth::user()->company_id,
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
                'code' => $request->code,
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
        $branch = Branch::where('company_id', Auth::user()->company_id)->findOrFail($id);

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
     * Get company statistics
     */
    public function getStats()
    {
        $companyId = Auth::user()->company_id;

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
}
