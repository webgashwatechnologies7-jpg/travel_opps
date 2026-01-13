<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Handle user login and return API token.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function login(Request $request): JsonResponse
    {
        try {
            // Validate the request
            \Illuminate\Support\Facades\Log::info('Login request received', [
                'email' => $request->input('email'),
                // Don't log raw password in real apps; only for local debug
                'password_length' => strlen((string) $request->input('password')),
            ]);

            $validator = Validator::make($request->all(), [
                'email' => 'required|email',
                'password' => 'required|string|min:6',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Attempt to find the user
            $user = User::where('email', $request->email)->first();
            $passwordToCheck = trim($request->password);

            if (!$user || !Hash::check($passwordToCheck, $user->password)) {
                $l = strlen($passwordToCheck);
                $lastCharAscii = $l > 0 ? ord(substr($passwordToCheck, -1)) : 'N/A';

                $debugMessage = 'Invalid credentials. ' .
                    'Email: ' . $request->email . ' | ' .
                    'PassLen: ' . $l . ' | ' .
                    'LastCharASCII: ' . $lastCharAscii . ' | ' .
                    'HashCheck: ' . ($user && Hash::check($passwordToCheck, $user->password) ? 'PASS' : 'FAIL');

                return response()->json([
                    'success' => false,
                    'message' => $debugMessage,
                ], 401);
            }

            // For non-super-admin users, check tenant context
            // Skip tenant check during login - tenant will be verified after login
            // This allows users to login first, then we check their company access
            if (!$user->isSuperAdmin() && $user->company_id) {
                // Verify user has a company assigned
                // Tenant verification will happen in subsequent requests via middleware
            }

            // Check if user is active
            if (!$user->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your account has been deactivated. Please contact administrator.',
                ], 403);
            }

            // Revoke all existing tokens (optional - for single device login)
            // $user->tokens()->delete();

            // Create a new token
            $token = $user->createToken('auth-token')->plainTextToken;

            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_super_admin' => $user->isSuperAdmin(),
            ];

            // Add company info if not super admin
            if (!$user->isSuperAdmin() && $user->company) {
                $userData['company'] = [
                    'id' => $user->company->id,
                    'name' => $user->company->name,
                    'subdomain' => $user->company->subdomain,
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => $userData,
                    'token' => $token,
                    'token_type' => 'Bearer',
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during login',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Handle user logout and revoke current token.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            // Get the authenticated user
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            // Revoke the current token
            $request->user()->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logout successful',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred during logout',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get the authenticated user's profile.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function profile(Request $request): JsonResponse
    {
        try {
            $user = $request->user();

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            return response()->json([
                'success' => true,
                'message' => 'Profile retrieved successfully',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'email_verified_at' => $user->email_verified_at,
                        'created_at' => $user->created_at,
                        'updated_at' => $user->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving profile',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
