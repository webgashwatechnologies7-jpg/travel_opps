<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeatureAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  $feature
     */
    public function handle(Request $request, Closure $next, string $feature): Response
    {
        $user = $request->user();

        // Super admin has access to everything
        if ($user && $user->isSuperAdmin()) {
            return $next($request);
        }

        // Get company from tenant
        $company = tenant();

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Company not found'
            ], 404);
        }

        // Check if company has access to this feature
        if (!$company->hasFeature($feature)) {
            return response()->json([
                'success' => false,
                'message' => 'This feature is not available in your subscription plan. Please upgrade to access this feature.',
                'feature' => $feature
            ], 403);
        }

        return $next($request);
    }
}

