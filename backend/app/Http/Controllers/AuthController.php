<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Company;
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
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials. Please check your email and password.',
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

            // Domain-based login: main domain = super admin only, company domain = company users only
            $requestHost = strtolower(trim($request->header('X-Request-Host') ?? ''));
            if (!$requestHost && $request->header('Origin')) {
                $parsed = parse_url($request->header('Origin'));
                $requestHost = isset($parsed['host']) ? strtolower($parsed['host']) : '';
            }
            if (!$requestHost) {
                $requestHost = strtolower($request->getHost());
            }

            $domainCandidates = $this->getDomainCandidates($requestHost);
            $companyForHost = Company::whereIn('domain', $domainCandidates)
                ->where('status', 'active')
                ->first();

            // If host matches a company domain -> company login (super admin NOT allowed)
            if ($companyForHost) {
                if ($user->isSuperAdmin()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Super admin must login from the main admin panel (e.g. http://127.0.0.1 or your server IP).',
                    ], 403);
                }
                if (!$user->company_id || (int) $user->company_id !== (int) $companyForHost->id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You do not have access to this company. Please login from your company\'s domain.',
                    ], 403);
                }
            } else {
                // Main domain (127.0.0.1, localhost, IP, etc.) -> super admin only
                if (!$user->isSuperAdmin()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Company users must login from their company domain (e.g. crm.yourcompany.com). Please use your company\'s URL.',
                    ], 403);
                }
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
                'roles' => $user->roles->pluck('name'),
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
     * Build possible domain matches for host (same logic as IdentifyTenant).
     */
    private function getDomainCandidates(string $host): array
    {
        $host = preg_replace('/:\d+$/', '', $host);
        $host = strtolower(trim($host));
        if (empty($host)) {
            return [];
        }
        $candidates = [$host];
        $hostNoWww = preg_replace('/^www\./', '', $host);
        if ($hostNoWww !== $host) {
            $candidates[] = $hostNoWww;
        }
        if (str_starts_with($hostNoWww, 'crm.')) {
            $candidates[] = substr($hostNoWww, 4);
        } else {
            $candidates[] = 'crm.' . $hostNoWww;
        }
        return array_values(array_unique(array_filter($candidates)));
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
                        'roles' => $user->roles->pluck('name'),
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
