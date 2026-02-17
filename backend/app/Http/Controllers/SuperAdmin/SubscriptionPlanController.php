<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SubscriptionPlanController extends Controller
{
    /**
     * Display a listing of subscription plans.
     */
    public function index()
    {
        $plans = SubscriptionPlan::orderBy('sort_order')->get();

        return response()->json([
            'success' => true,
            'data' => $plans
        ]);
    }

    /**
     * Store a newly created subscription plan.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:subscription_plans,slug',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'billing_period' => 'required|in:monthly,yearly',
            'max_users' => 'nullable|integer|min:1',
            'max_leads' => 'nullable|integer|min:1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $plan = SubscriptionPlan::create($request->all());

        return response()->json([
            'success' => true,
            'message' => 'Subscription plan created successfully',
            'data' => $plan
        ], 201);
    }

    /**
     * Display the specified subscription plan.
     */
    public function show($id)
    {
        $plan = SubscriptionPlan::withCount('companies')->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $plan
        ]);
    }

    /**
     * Update the specified subscription plan.
     */
    public function update(Request $request, $id)
    {
        $plan = SubscriptionPlan::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'slug' => 'sometimes|required|string|max:255|unique:subscription_plans,slug,' . $id,
            'description' => 'nullable|string',
            'price' => 'sometimes|required|numeric|min:0',
            'billing_period' => 'sometimes|required|in:monthly,yearly',
            'max_users' => 'nullable|integer|min:1',
            'max_leads' => 'nullable|integer|min:1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
            'sort_order' => 'integer',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $plan->update($request->all());

        // Force logout all users belonging to this plan to ensure they get the updated settings on next login
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
            }
        } catch (\Exception $e) {
            \Log::error("Failed to force logout users for plan {$id}: " . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Subscription plan updated successfully',
            'data' => $plan->fresh()
        ]);
    }

    /**
     * Remove the specified subscription plan.
     */
    public function destroy($id)
    {
        $plan = SubscriptionPlan::findOrFail($id);

        // Check if any companies are using this plan
        if ($plan->companies()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete plan. Companies are using this plan.'
            ], 422);
        }

        $plan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Subscription plan deleted successfully'
        ]);
    }
}

