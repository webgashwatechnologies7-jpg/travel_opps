<?php

namespace App\Modules\Crm\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Mail\SendUserCredentials;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use App\Services\CompanyMailSettingsService;

class AdminUserController extends Controller
{
    /**
     * Create a new user.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:users,email',
                'phone' => 'nullable|string|max:20|unique:users,phone',
                'password' => 'required|string|min:6',
                'role' => 'required|string|exists:roles,name',
                'is_active' => 'boolean',
            ], [
                'name.required' => 'The name field is required.',
                'email.required' => 'The email field is required.',
                'email.email' => 'The email must be a valid email address.',
                'email.unique' => 'The email has already been taken.',
                'phone.unique' => 'The phone number has already been taken.',
                'password.required' => 'The password field is required.',
                'password.min' => 'The password must be at least 6 characters.',
                'role.required' => 'The role field is required.',
                'role.exists' => 'The selected role is invalid.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Create the user
            $user = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'password' => Hash::make($request->password),
                'is_active' => $request->boolean('is_active', true),
            ]);

            // Assign role
            $user->assignRole($request->role);

            // Send credentials email
            try {
                CompanyMailSettingsService::applyIfEnabled();
                Mail::to($user->email)->send(new SendUserCredentials(
                    $user->email,
                    $request->password
                ));
            } catch (\Exception $mailException) {
                // Log the error but don't fail the request
                \Log::error('Failed to send credentials email: ' . $mailException->getMessage());
            }

            // Load role for response
            $user->load('roles');

            return response()->json([
                'success' => true,
                'message' => 'User created successfully',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'is_active' => $user->is_active,
                        'role' => $user->roles->first()?->name,
                        'created_at' => $user->created_at,
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating user',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get all users with role and is_active.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id;

            $users = User::with('roles')
                ->where('company_id', $companyId)
                ->select('id', 'name', 'email', 'phone', 'is_active', 'created_at', 'updated_at')
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'is_active' => $user->is_active,
                        'role' => $user->roles->first()?->name,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Users retrieved successfully',
                'data' => [
                    'users' => $users,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving users',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get single user with role and targets.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $user = User::with(['roles', 'targets'])->find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            $targets = $user->targets
                ->sortByDesc('month')
                ->values()
                ->map(function ($target) {
                    return [
                        'id' => $target->id,
                        'month' => $target->month,
                        'target_amount' => $target->target_amount,
                        'achieved_amount' => $target->achieved_amount,
                        'created_at' => $target->created_at,
                        'updated_at' => $target->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'User retrieved successfully',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'is_active' => $user->is_active,
                        'role' => $user->roles->first()?->name,
                        'targets' => $targets,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving user',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update user details and role.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'email' => 'sometimes|required|email|unique:users,email,' . $id,
                'phone' => 'nullable|string|max:20|unique:users,phone,' . $id,
                'password' => 'sometimes|string|min:6',
                'role' => 'sometimes|required|string|exists:roles,name',
                'is_active' => 'sometimes|boolean',
            ], [
                'name.required' => 'The name field is required.',
                'email.required' => 'The email field is required.',
                'email.email' => 'The email must be a valid email address.',
                'email.unique' => 'The email has already been taken.',
                'phone.unique' => 'The phone number has already been taken.',
                'password.min' => 'The password must be at least 6 characters.',
                'role.required' => 'The role field is required.',
                'role.exists' => 'The selected role is invalid.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Update user fields
            $updateData = [];
            if ($request->has('name')) {
                $updateData['name'] = $request->name;
            }
            if ($request->has('email')) {
                $updateData['email'] = $request->email;
            }
            if ($request->has('phone')) {
                $updateData['phone'] = $request->phone;
            }
            if ($request->has('password')) {
                $updateData['password'] = Hash::make($request->password);
            }
            if ($request->has('is_active')) {
                $updateData['is_active'] = $request->boolean('is_active');

                // Revoke all tokens if user is being deactivated
                if (!$request->boolean('is_active')) {
                    $user->tokens()->delete();
                }
            }

            if (!empty($updateData)) {
                $user->update($updateData);
            }

            // Update role if provided
            if ($request->has('role')) {
                $user->syncRoles([$request->role]);
            }

            // Load role for response
            $user->load('roles');

            return response()->json([
                'success' => true,
                'message' => 'User updated successfully',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'is_active' => $user->is_active,
                        'role' => $user->roles->first()?->name,
                        'updated_at' => $user->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating user',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Soft delete user.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            // Prevent admin from deleting themselves
            if ($user->id === $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account',
                ], 403);
            }

            // Revoke all tokens
            $user->tokens()->delete();

            // Delete the user
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'User deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting user',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update user status (activate/deactivate).
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        try {
            // Find the user
            $user = User::find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }

            // Prevent admin from deactivating themselves
            if ($user->id === $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot change your own status',
                ], 403);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'is_active' => 'required|boolean',
            ], [
                'is_active.required' => 'The is_active field is required.',
                'is_active.boolean' => 'The is_active field must be a boolean value.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Get the old status for logging/messaging
            $oldStatus = $user->is_active;
            $newStatus = $request->boolean('is_active');

            // Update user status
            $user->update([
                'is_active' => $newStatus,
            ]);

            // Revoke all tokens if user is being deactivated
            if ($oldStatus && !$newStatus) {
                $user->tokens()->delete();
            }

            $statusMessage = $newStatus
                ? 'User activated successfully. User can now access the system.'
                : 'User deactivated successfully. All user sessions have been revoked.';

            return response()->json([
                'success' => true,
                'message' => $statusMessage,
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                        'is_active' => $user->is_active,
                        'updated_at' => $user->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating user status',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

