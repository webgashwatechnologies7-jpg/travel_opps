<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanFeature;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubscriptionPlanFeatureController extends Controller
{
    /**
     * Get all available features.
     */
    public function getAvailableFeatures()
    {
        return response()->json([
            'success' => true,
            'data' => SubscriptionPlanFeature::getAvailableFeatures()
        ]);
    }

    /**
     * Get features for a specific plan.
     */
    public function getPlanFeatures($planId)
    {
        try {
            $plan = SubscriptionPlan::with('features')->findOrFail($planId);

            $availableFeatures = SubscriptionPlanFeature::getAvailableFeatures();

            // Reload plan fresh from database
            $plan->refresh();
            $plan->load('features');

            // Get plan's permissions column (array of enabled feature IDs)
            $permissionIds = $plan->permissions ?? [];

            // Debug: Log permissions
            \Log::info("Plan {$planId} permissions: " . json_encode($permissionIds) . " (count: " . count($permissionIds) . ")");

            // Get existing plan features from subscription_plan_features table
            // Try loading by relationship first
            $planFeatures = $plan->features && $plan->features->count() > 0
                ? $plan->features->keyBy('feature_key')
                : collect();

            // If relationship returned empty, try loading directly by subscription_plan_id
            if ($planFeatures->count() === 0) {
                $planFeatures = SubscriptionPlanFeature::where('subscription_plan_id', $planId)
                    ->get()
                    ->keyBy('feature_key');
                \Log::info("Plan {$planId} loaded {$planFeatures->count()} features directly by subscription_plan_id");
            }

            // If still empty but permissions exist, load features by IDs from permissions
            if ($planFeatures->count() === 0 && !empty($permissionIds)) {
                $featureIds = array_map('intval', $permissionIds);
                \Log::info("Plan {$planId} trying to load features by IDs from permissions: " . json_encode($featureIds));

                // Load features by IDs
                $loadedFeatures = SubscriptionPlanFeature::whereIn('id', $featureIds)->get();
                \Log::info("Plan {$planId} found {$loadedFeatures->count()} features by IDs");

                if ($loadedFeatures->count() > 0) {
                    $planFeatures = $loadedFeatures->keyBy('feature_key');
                    \Log::info("Plan {$planId} successfully loaded {$planFeatures->count()} features by IDs from permissions");
                }
            }

            \Log::info("Plan {$planId} final features count: " . $planFeatures->count());

            // Convert permissions to integers for comparison
            $permissionIdsInt = array_map('intval', $permissionIds);

            // Merge available features with plan features
            $features = [];
            foreach ($availableFeatures as $key => $feature) {
                $planFeature = $planFeatures->get($key);

                // Determine if feature is enabled
                $isEnabled = false;
                $featureId = null;

                if ($planFeature) {
                    // Feature exists in subscription_plan_features table
                    $featureId = $planFeature->id;
                    $featureIdInt = (int) $featureId;

                    // PRIMARY CHECK: Check if feature ID is in permissions array
                    if (!empty($permissionIdsInt) && in_array($featureIdInt, $permissionIdsInt, true)) {
                        // Feature ID found in permissions array
                        $isEnabled = true;
                    } else {
                        // Fallback: check is_enabled column in subscription_plan_features table
                        $rawValue = $planFeature->getRawOriginal('is_enabled');
                        $isEnabled = ($rawValue == 1 || $rawValue === true || $rawValue === '1' || $rawValue === 'true');
                    }
                } else {
                    // Feature doesn't exist in subscription_plan_features table
                    // Check if we can find it by matching available feature with permissions
                    // For now, mark as disabled
                    $isEnabled = false;
                }

                $features[] = [
                    'feature_key' => $key,
                    'feature_name' => $feature['name'],
                    'description' => $feature['description'],
                    'has_limit' => $feature['has_limit'] ?? false,
                    'limit_label' => $feature['limit_label'] ?? null,
                    'is_enabled' => $isEnabled,
                    'limit_value' => $planFeature && $planFeature->limit_value ? (int) $planFeature->limit_value : null,
                    'feature_id' => $featureId,
                ];
            }

            // Debug: Log enabled count
            $enabledCount = count(array_filter($features, function ($f) {
                return $f['is_enabled'] === true; }));
            \Log::info("Plan {$planId} API response: " . count($features) . " features, {$enabledCount} enabled");
            if ($enabledCount > 0) {
                $enabledFeatures = array_filter($features, function ($f) {
                    return $f['is_enabled'] === true; });
                \Log::info("Sample enabled feature: " . json_encode(array_values($enabledFeatures)[0]));
            } else {
                \Log::warning("Plan {$planId} has {$enabledCount} enabled features. Permission IDs: " . json_encode($permissionIds));
            }

            return response()->json([
                'success' => true,
                'data' => $features
            ]);
        } catch (\Exception $e) {
            \Log::error("Failed to load plan features for plan {$planId}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to load plan features: ' . $e->getMessage(),
                'data' => []
            ], 500);
        }
    }

    /**
     * Update features for a plan.
     */
    public function updatePlanFeatures(Request $request, $planId)
    {
        try {
            $plan = SubscriptionPlan::findOrFail($planId);

            // Validate request
            $validator = Validator::make($request->all(), [
                'features' => 'required|array',
                'features.*.feature_key' => 'required|string',
                'features.*.is_enabled' => 'required|boolean',
                'features.*.limit_value' => 'nullable|integer|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $availableFeatures = SubscriptionPlanFeature::getAvailableFeatures();
            $updatedCount = 0;
            $enabledFeatureIds = []; // Store enabled feature IDs for permissions column

            foreach ($request->features as $featureData) {
                $featureKey = $featureData['feature_key'];

                // Verify feature exists in available features
                if (!isset($availableFeatures[$featureKey])) {
                    continue; // Skip invalid features
                }

                // Ensure is_enabled is properly converted to boolean
                $isEnabled = false;
                if (isset($featureData['is_enabled'])) {
                    $isEnabledValue = $featureData['is_enabled'];
                    $isEnabled = $isEnabledValue === true || $isEnabledValue === 'true' || $isEnabledValue === 1 || $isEnabledValue === '1';
                }

                $limitValue = isset($featureData['limit_value']) && $featureData['limit_value'] !== ''
                    ? (int) $featureData['limit_value']
                    : null;

                // Debug: Log first few features being saved
                if ($updatedCount < 3) {
                    \Log::info("Saving feature {$featureKey}: is_enabled = " . var_export($featureData['is_enabled'], true) . " -> " . var_export($isEnabled, true));
                }

                $savedFeature = SubscriptionPlanFeature::updateOrCreate(
                    [
                        'subscription_plan_id' => $plan->id,
                        'feature_key' => $featureKey,
                    ],
                    [
                        'feature_name' => $availableFeatures[$featureKey]['name'] ?? $featureKey,
                        'is_enabled' => $isEnabled,
                        'limit_value' => $limitValue,
                    ]
                );

                // Verify the saved value
                $savedFeature->refresh();
                if ($savedFeature->is_enabled != $isEnabled && $updatedCount < 3) {
                    \Log::warning("Feature {$featureKey} save mismatch: saved " . var_export($savedFeature->is_enabled, true) . " but expected " . var_export($isEnabled, true));
                }

                // Verify save was successful
                $savedFeature->refresh();
                // Compare as boolean to handle type differences
                $savedBool = (bool) $savedFeature->is_enabled;
                $expectedBool = (bool) $isEnabled;

                if ($savedBool === $expectedBool) {
                    $updatedCount++;

                    // If feature is enabled, add its ID to permissions array
                    if ($isEnabled) {
                        $enabledFeatureIds[] = $savedFeature->id;
                    }
                } else {
                    \Log::warning("Feature {$featureKey} save mismatch: expected " . var_export($isEnabled, true) . " ({$expectedBool}), got " . var_export($savedFeature->is_enabled, true) . " ({$savedBool})");
                }
            }

            // Update permissions column in subscription_plans table with enabled feature IDs
            $plan->permissions = $enabledFeatureIds;
            $plan->save();

            // Force logout all users belonging to this plan to ensure they get the updated permissions on next login
            try {
                $companyIds = \App\Models\Company::where('subscription_plan_id', $plan->id)->pluck('id');
                if ($companyIds->isNotEmpty()) {
                    \DB::table('personal_access_tokens')
                        ->whereIn('tokenable_id', function ($query) use ($companyIds) {
                            $query->select('id')
                                ->from('users')
                                ->whereIn('company_id', $companyIds);
                        })
                        ->where('tokenable_type', \App\Models\User::class)
                        ->delete();

                    \Log::info("Force logged out users for plan {$planId} due to permission update.");
                }
            } catch (\Exception $e) {
                \Log::error("Failed to force logout users for plan {$planId}: " . $e->getMessage());
            }

            return $this->getPlanFeatures($planId);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update features: ' . $e->getMessage(),
                'errors' => []
            ], 500);
        }
    }
}

