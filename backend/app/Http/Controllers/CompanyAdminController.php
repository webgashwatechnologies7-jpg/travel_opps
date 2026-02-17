<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\User;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CompanyAdminController extends Controller
{
    /**
     * Create a new company admin with subscription-based access
     */
    public function createCompanyAdmin(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'company_name' => 'required|string|max:255',
                'company_email' => 'required|email|max:255',
                'company_phone' => 'nullable|string|max:20',
                'company_address' => 'nullable|string|max:500',
                'admin_name' => 'required|string|max:255',
                'admin_email' => 'required|email|max:255|unique:users,email',
                'admin_password' => 'required|string|min:8',
                'subscription_plan_id' => 'required|exists:subscription_plans,id',
                'subscription_start_date' => 'required|date',
                'subscription_end_date' => 'required|date|after_or_equal:subscription_start_date',
                'subdomain' => 'nullable|string|max:50|unique:companies,subdomain',
                'domain' => 'nullable|string|max:255|unique:companies,domain',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Get subscription plan
            $subscriptionPlan = SubscriptionPlan::findOrFail($request->subscription_plan_id);

            // Create company
            $company = Company::create([
                'name' => $request->company_name,
                'email' => $request->company_email,
                'phone' => $request->company_phone,
                'address' => $request->company_address,
                'subdomain' => $request->subdomain ?: Str::slug($request->company_name) . '-' . Str::random(5),
                'domain' => $request->domain,
                'status' => 'pending', // Pending until activation
                'dns_status' => 'pending',
                'dns_verification_token' => Str::random(60),
                'subscription_plan_id' => $request->subscription_plan_id,
                'subscription_start_date' => $request->subscription_start_date,
                'subscription_end_date' => $request->subscription_end_date,
            ]);

            // Create company admin user
            $adminUser = User::create([
                'name' => $request->admin_name,
                'email' => $request->admin_email,
                'password' => Hash::make($request->admin_password),
                'is_super_admin' => false, // Company admin, not super admin
                'is_active' => true,
                'company_id' => $company->id,
            ]);

            // Assign Company Admin role
            $companyAdminRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Company Admin']);
            $adminUser->assignRole('Company Admin');

            // Assign permissions based on subscription plan
            $this->assignPlanPermissions($adminUser, $subscriptionPlan);

            // Load relationships
            $company->load(['subscriptionPlan', 'users']);
            $adminUser->load(['roles', 'permissions', 'company']);

            // Send Welcome Email
            try {
                \Illuminate\Support\Facades\Mail::to($request->company_email)->send(new \App\Mail\WelcomeEmail($company, $request->admin_password));
            } catch (\Exception $e) {
                // Log email error but don't fail creation
                \Illuminate\Support\Facades\Log::error('Failed to send welcome email: ' . $e->getMessage());
            }

            return response()->json([
                'success' => true,
                'message' => 'Company admin created successfully. Welcome email sent.',
                'data' => [
                    'company' => [
                        'id' => $company->id,
                        'name' => $company->name,
                        'email' => $company->email,
                        'subdomain' => $company->subdomain,
                        'domain' => $company->domain,
                        'status' => $company->status,
                        'subscription_plan' => [
                            'id' => $company->subscriptionPlan->id,
                            'name' => $company->subscriptionPlan->name,
                            'max_users' => $company->subscriptionPlan->max_users,
                            'max_leads' => $company->subscriptionPlan->max_leads,
                            'features' => $company->subscriptionPlan->getEnabledFeaturesFromPermissions(),
                        ],
                        'subscription_dates' => [
                            'start_date' => $company->subscription_start_date,
                            'end_date' => $company->subscription_end_date,
                            'is_expired' => $company->isSubscriptionExpired(),
                            'is_expiring_soon' => $company->isSubscriptionExpiringSoon(),
                        ],
                    ],
                    'admin_user' => [
                        'id' => $adminUser->id,
                        'name' => $adminUser->name,
                        'email' => $adminUser->email,
                        'roles' => $adminUser->getRoleNames(),
                        'permissions' => $adminUser->getAllPermissions()->pluck('name'),
                        'company_id' => $adminUser->company_id,
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create company admin',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get all company admins (for super admin)
     */
    public function getCompanyAdmins(): JsonResponse
    {
        try {
            $companyAdmins = User::with(['company.subscriptionPlan', 'roles', 'permissions'])
                ->whereHas('roles', function ($query) {
                    $query->where('name', 'Company Admin');
                })
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Company admins retrieved successfully',
                'data' => [
                    'admins' => $companyAdmins->map(function ($admin) {
                        return [
                            'id' => $admin->id,
                            'name' => $admin->name,
                            'email' => $admin->email,
                            'is_active' => $admin->is_active,
                            'company' => [
                                'id' => $admin->company->id ?? null,
                                'name' => $admin->company->name ?? 'No Company',
                                'subscription_plan' => $admin->company->subscriptionPlan->name ?? 'No Plan',
                                'subscription_status' => $admin->company?->isSubscriptionExpired() ? 'Expired' : 'Active',
                            ],
                            'roles' => $admin->getRoleNames(),
                            'permissions_count' => $admin->getAllPermissions()->count(),
                            'created_at' => $admin->created_at,
                        ];
                    }),
                    'total' => $companyAdmins->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve company admins',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update company admin permissions based on subscription plan
     */
    public function updateCompanyAdminPermissions(Request $request, $userId): JsonResponse
    {
        try {
            $user = User::findOrFail($userId);

            // Verify user is company admin
            if (!$user->hasRole('Company Admin')) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not a company admin',
                ], 403);
            }

            // Update subscription plan if provided
            if ($request->has('subscription_plan_id')) {
                $user->company->update([
                    'subscription_plan_id' => $request->subscription_plan_id,
                    'subscription_end_date' => $request->subscription_end_date,
                ]);
            }

            // Reassign permissions based on new plan
            $subscriptionPlan = $user->company->subscriptionPlan;
            $this->assignPlanPermissions($user, $subscriptionPlan);

            return response()->json([
                'success' => true,
                'message' => 'Company admin permissions updated successfully',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'permissions' => $user->getAllPermissions()->pluck('name'),
                        'subscription_plan' => $user->company->subscriptionPlan->name,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update permissions',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Assign permissions to user based on subscription plan
     */
    private function assignPlanPermissions(User $user, SubscriptionPlan $plan): void
    {
        // Get all permissions from subscription plan
        $featureIds = $plan->getEnabledFeatureIds();

        if (empty($featureIds)) {
            return;
        }

        // Get feature permissions
        $features = \App\Models\SubscriptionPlanFeature::whereIn('id', $featureIds)
            ->where('is_enabled', true)
            ->get();

        foreach ($features as $feature) {
            $permissionName = $feature->feature_key;

            // Create permission if it doesn't exist
            $permission = \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $permissionName]);

            // Assign permission to user
            $user->givePermissionTo($permissionName);
        }

        // Always give basic permissions to company admin
        $basicPermissions = ['view dashboard', 'manage profile'];
        foreach ($basicPermissions as $perm) {
            $permission = \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $perm]);
            $user->givePermissionTo($perm);
        }
    }

    /**
     * Get available subscription plans
     */
    public function getSubscriptionPlans(): JsonResponse
    {
        try {
            $plans = SubscriptionPlan::with([
                'features' => function ($query) {
                    $query->where('is_enabled', true);
                }
            ])
                ->where('is_active', true)
                ->orderBy('sort_order')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Subscription plans retrieved successfully',
                'data' => [
                    'plans' => $plans->map(function ($plan) {
                        return [
                            'id' => $plan->id,
                            'name' => $plan->name,
                            'slug' => $plan->slug,
                            'description' => $plan->description,
                            'price' => $plan->price,
                            'billing_period' => $plan->billing_period,
                            'max_users' => $plan->max_users,
                            'max_leads' => $plan->max_leads,
                            'features' => $plan->features->map(function ($feature) {
                                return [
                                    'id' => $feature->id,
                                    'feature_key' => $feature->feature_key,
                                    'feature_name' => $feature->feature_name,
                                    'description' => $feature->description,
                                    'limit_value' => $feature->limit_value,
                                    'is_enabled' => $feature->is_enabled,
                                ];
                            }),
                        ];
                    }),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve subscription plans',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
