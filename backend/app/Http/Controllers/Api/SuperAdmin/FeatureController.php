<?php

namespace App\Http\Controllers\Api\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionFeature;
use App\Models\SubscriptionPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeatureController extends Controller
{
    /**
     * Get all available system features.
     */
    public function index(): JsonResponse
    {
        $features = SubscriptionFeature::all();
        return response()->json([
            'success' => true,
            'data' => $features
        ]);
    }

    /**
     * Update features for a specific subscription plan.
     */
    public function updatePlanFeatures(Request $request, $planId): JsonResponse
    {
        $request->validate([
            'features' => 'required|array',
            'features.*.feature_id' => 'nullable|exists:subscription_features,id',
            'features.*.feature_key' => 'nullable|string|exists:subscription_features,key',
            'features.*.is_active' => 'nullable|boolean',
            'features.*.is_enabled' => 'nullable|boolean',
            'features.*.limit_value' => 'nullable|integer',
        ]);

        $plan = SubscriptionPlan::findOrFail($planId);

        // Prepare sync data
        $syncData = [];
        foreach ($request->features as $feature) {
            $id = $feature['feature_id'] ?? null;

            // If ID is missing, try to find by key
            if (!$id && isset($feature['feature_key'])) {
                $id = \App\Models\SubscriptionFeature::where('key', $feature['feature_key'])->value('id');
            }

            if ($id) {
                // Support both is_active and is_enabled
                $isActive = $feature['is_active'] ?? $feature['is_enabled'] ?? true;

                $syncData[$id] = [
                    'is_active' => $isActive,
                    'limit_value' => $feature['limit_value'] ?? null,
                ];
            }
        }

        $plan->planFeatures()->sync($syncData);

        return response()->json([
            'success' => true,
            'message' => 'Plan features updated successfully',
            'data' => $plan->load('planFeatures')
        ]);
    }

    /**
     * Get features for a specific subscription plan.
     */
    public function getPlanFeatures($planId): JsonResponse
    {
        $plan = SubscriptionPlan::with('planFeatures')->findOrFail($planId);
        $allFeatures = SubscriptionFeature::all();

        $mappedFeatures = $allFeatures->map(function ($feature) use ($plan) {
            $planFeature = $plan->planFeatures->firstWhere('id', $feature->id);

            return [
                'feature_id' => $feature->id,
                'feature_key' => $feature->key,
                'feature_name' => $feature->name,
                'description' => $feature->description,
                'has_limit' => $feature->has_limit,
                'limit_label' => $feature->limit_label,
                'is_enabled' => $planFeature ? (bool) $planFeature->pivot->is_active : false,
                'limit_value' => $planFeature ? $planFeature->pivot->limit_value : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $mappedFeatures
        ]);
    }
}
