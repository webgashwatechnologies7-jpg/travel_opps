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

            // Attempt to find the user with error handling
            try {
                $user = User::where('email', $request->email)->first();
            } catch (\Exception $dbError) {
                \Log::error('Database error during login', [
                    'error' => $dbError->getMessage(),
                    'email' => $request->email,
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Login service temporarily unavailable',
                ], 503);
            }

            $passwordToCheck = trim($request->password);

            if (!$user || !Hash::check($passwordToCheck, $user->password)) {
                \Log::warning('Login attempt with invalid credentials', [
                    'email' => $request->email,
                    'user_exists' => !is_null($user),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);

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

            // Create a new token with error handling
            try {
                $token = $user->createToken('auth-token')->plainTextToken;
            } catch (\Exception $tokenError) {
                \Log::error('Error creating authentication token', [
                    'error' => $tokenError->getMessage(),
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Authentication service temporarily unavailable',
                ], 503);
            }

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

                // Load plan features
                $user->load(['company.subscriptionPlan.planFeatures']);
                $planFeatures = [];
                if ($user->company->subscriptionPlan) {
                    foreach ($user->company->subscriptionPlan->planFeatures as $feature) {
                        if ($feature->pivot->is_active) {
                            $planFeatures[$feature->key] = [
                                'enabled' => true,
                                'limit' => $feature->pivot->limit_value
                            ];
                        }
                    }
                }
                $userData['plan_features'] = $planFeatures;
            }

            \Log::info('User logged in successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Login successful',
                'data' => [
                    'user' => array_merge($userData, [
                        'permissions' => $user->getAllPermissions()->pluck('name'),
                    ]),
                    'token' => $token,
                    'token_type' => 'Bearer',
                ],
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Login error', [
                'error' => $e->getMessage(),
                'email' => $request->email ?? 'not_provided',
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ]);

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
            // Get the current token before user check
            $token = $request->bearerToken();

            // Get authenticated user
            $user = $request->user();

            if (!$user) {
                \Log::warning('Logout attempt with invalid token', [
                    'token_exists' => !empty($token),
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            // Revoke current token with error handling
            try {
                $currentToken = $user->currentAccessToken();
                if ($currentToken) {
                    $tokenId = $currentToken->id;
                    $currentToken->delete();

                    \Log::info('User logged out successfully', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'token_id' => $tokenId,
                        'ip' => $request->ip()
                    ]);
                } else {
                    \Log::warning('Logout attempt but no current token found', [
                        'user_id' => $user->id,
                        'email' => $user->email
                    ]);
                }
            } catch (\Exception $tokenError) {
                \Log::error('Error revoking token during logout', [
                    'error' => $tokenError->getMessage(),
                    'user_id' => $user->id
                ]);

                // Continue with logout response even if token revocation fails
            }

            return response()->json([
                'success' => true,
                'message' => 'Logout successful',
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Logout error', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent()
            ]);

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
                \Log::warning('Profile access attempt with invalid authentication', [
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                    'has_token' => !empty($request->bearerToken())
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            // Load relationships with error handling
            try {
                $user->load(['roles', 'company.subscriptionPlan.planFeatures']);
            } catch (\Exception $relationError) {
                \Log::error('Error loading user relationships for profile', [
                    'error' => $relationError->getMessage(),
                    'user_id' => $user->id
                ]);

                // Continue without relationships
            }

            $profileData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'email_verified_at' => $user->email_verified_at,
                'is_active' => $user->is_active ?? true,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
                'roles' => isset($user->roles) ? $user->roles->pluck('name') : [],
                'permissions' => $user->getAllPermissions()->pluck('name'),
            ];

            // Add company info if available
            $planFeatures = [];
            if (isset($user->company) && $user->company) {
                $profileData['company'] = [
                    'id' => $user->company->id,
                    'name' => $user->company->name,
                    'subdomain' => $user->company->subdomain,
                    'status' => $user->company->status ?? 'unknown'
                ];

                // Load plan features
                if ($user->company->subscriptionPlan) {
                    foreach ($user->company->subscriptionPlan->planFeatures as $feature) {
                        if ($feature->pivot->is_active) {
                            $planFeatures[$feature->key] = [
                                'enabled' => true,
                                'limit' => $feature->pivot->limit_value
                            ];
                        }
                    }
                }
            }
            $profileData['plan_features'] = $planFeatures;

            \Log::info('Profile accessed successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'ip' => $request->ip()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile retrieved successfully',
                'data' => [
                    'user' => $profileData,
                ],
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Profile retrieval error', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'user_id' => auth()->id() ?? 'unknown'
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving profile',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
