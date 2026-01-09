<?php

namespace App\Modules\Crm\Presentation\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionController extends Controller
{
    /**
     * Get all roles.
     *
     * @return JsonResponse
     */
    public function getRoles(): JsonResponse
    {
        try {
            $roles = Role::orderBy('name')->get(['id', 'name']);

            return response()->json([
                'success' => true,
                'message' => 'Roles retrieved successfully',
                'data' => [
                    'roles' => $roles,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving roles',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get all permissions.
     *
     * @return JsonResponse
     */
    public function getPermissions(): JsonResponse
    {
        try {
            $permissions = Permission::orderBy('name')->get(['id', 'name']);

            return response()->json([
                'success' => true,
                'message' => 'Permissions retrieved successfully',
                'data' => [
                    'permissions' => $permissions,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving permissions',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get permissions for a specific role.
     *
     * @param string $roleName
     * @return JsonResponse
     */
    public function getRolePermissions(string $roleName): JsonResponse
    {
        try {
            $role = Role::where('name', $roleName)->first();

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found',
                ], 404);
            }

            $permissions = $role->permissions->pluck('id')->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Role permissions retrieved successfully',
                'data' => [
                    'role' => [
                        'id' => $role->id,
                        'name' => $role->name,
                    ],
                    'permissions' => $permissions,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving role permissions',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update permissions for a role.
     *
     * @param Request $request
     * @param string $roleName
     * @return JsonResponse
     */
    public function updateRolePermissions(Request $request, string $roleName): JsonResponse
    {
        try {
            $role = Role::where('name', $roleName)->first();

            if (!$role) {
                return response()->json([
                    'success' => false,
                    'message' => 'Role not found',
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'permissions' => 'required|array',
                'permissions.*' => 'exists:permissions,id',
            ], [
                'permissions.required' => 'The permissions field is required.',
                'permissions.array' => 'The permissions must be an array.',
                'permissions.*.exists' => 'One or more permissions are invalid.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Sync permissions (removes all existing and assigns new ones)
            $permissionIds = $request->input('permissions', []);
            $permissions = Permission::whereIn('id', $permissionIds)->get();
            $role->syncPermissions($permissions);

            // Clear permission cache
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            return response()->json([
                'success' => true,
                'message' => 'Role permissions updated successfully',
                'data' => [
                    'role' => [
                        'id' => $role->id,
                        'name' => $role->name,
                    ],
                    'permissions' => $role->permissions->pluck('id')->toArray(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating role permissions',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

