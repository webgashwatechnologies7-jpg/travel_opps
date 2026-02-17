<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPlanFeature
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $featureKey): Response
    {
        $user = $request->user();

        // 1. Super Admins bypass all restrictions
        if ($user && $user->isSuperAdmin()) {
            return $next($request);
        }

        // 2. Check if User belongs to a Company
        if (!$user || !$user->company) {
            // If no company context, we can't check plan features. 
            // Depending on route, we might want to deny strictly.
            // For now, deny if it's a feature-gated route.
            return response()->json(['message' => 'Unauthorized access.'], 403);
        }

        // 3. Check Subscription Plan Feature
        $plan = $user->company->subscriptionPlan;

        if (!$plan || !$plan->hasDynamicFeature($featureKey)) {
            return response()->json([
                'success' => false,
                'message' => 'This feature is not available in your subscription plan (' . $featureKey . ').',
                'error_code' => 'FEATURE_NOT_IN_PLAN'
            ], 403);
        }

        return $next($request);
    }
}
