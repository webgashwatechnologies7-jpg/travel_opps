<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Company;

class IdentifyTenant
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Skip tenant identification for auth routes (login, logout, etc.)
        // Super admin and regular users both need to login first
        if ($request->is('api/auth/*') || $request->is('api/password/*') || $request->is('api/test-unique')) {
            app()->instance('tenant', null);
            return $next($request);
        }

        // Extract subdomain from host
        $host = $request->getHost();
        $subdomain = $this->extractSubdomain($host);

        // If no subdomain or subdomain is 'www' or 'admin', skip tenant identification
        if (!$subdomain || in_array($subdomain, ['www', 'admin', 'api'])) {
            // This is the main domain - could be super admin dashboard.
            // For local/dev usage (no subdomain), try to infer tenant from authenticated user.
            $user = $request->user();
            if ($user && !$user->isSuperAdmin() && $user->company && $user->company->status === 'active') {
                app()->instance('tenant', $user->company);
                config(['tenant.id' => $user->company->id]);
                config(['tenant.company' => $user->company]);
                return $next($request);
            }

            app()->instance('tenant', null);
            return $next($request);
        }

        // Find company by subdomain
        $company = Company::where('subdomain', $subdomain)
            ->where('status', 'active')
            ->first();

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Company not found or inactive',
                'subdomain' => $subdomain
            ], 404);
        }

        // Set tenant in application container
        app()->instance('tenant', $company);

        // Set company_id in config for global access
        config(['tenant.id' => $company->id]);
        config(['tenant.company' => $company]);

        return $next($request);
    }

    /**
     * Extract subdomain from host.
     *
     * @param string $host
     * @return string|null
     */
    private function extractSubdomain(string $host): ?string
    {
        $parts = explode('.', $host);

        // Handle CRM URL format: c.gashwa.com -> extract "gashwa"
        // If first part is "c", skip it and use the second part
        if (count($parts) > 2 && $parts[0] === 'c') {
            return $parts[1]; // Return the actual subdomain after "c"
        }

        // If we have more than 2 parts, first part is subdomain
        // Example: company1.travelops.com -> company1
        if (count($parts) > 2) {
            return $parts[0];
        }

        // For localhost development
        // You can use: company1.localhost or set X-Subdomain header
        if ($host === 'localhost' || str_contains($host, '127.0.0.1') || str_contains($host, 'localhost')) {
            // Check if subdomain is in query string or header for development
            $subdomain = request()->header('X-Subdomain') ?? request()->query('subdomain');

            // Also try to extract from host if it's like company1.localhost or c.company1.localhost
            if (!$subdomain && str_contains($host, '.')) {
                $hostParts = explode('.', $host);
                if (count($hostParts) > 1 && $hostParts[0] !== 'www') {
                    // If first part is "c", use second part
                    if ($hostParts[0] === 'c' && count($hostParts) > 2) {
                        $subdomain = $hostParts[1];
                    } else {
                        $subdomain = $hostParts[0];
                    }
                }
            }

            return $subdomain;
        }

        return null;
    }
}

