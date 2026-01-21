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
        // Also skip for super admin routes since they don't require tenant context
        if ($request->is('api/auth/*') || $request->is('api/password/*') || $request->is('api/test-unique') || $request->is('api/super-admin/*')) {
            app()->instance('tenant', null);
            return $next($request);
        }

        // If subdomain is provided explicitly, use it first
        $forcedSubdomain = $request->header('X-Subdomain') ?? $request->query('subdomain');
        if ($forcedSubdomain) {
            $company = Company::where('subdomain', $forcedSubdomain)
                ->where('status', 'active')
                ->first();
            if ($company) {
                app()->instance('tenant', $company);
                config(['tenant.id' => $company->id]);
                config(['tenant.company' => $company]);
                return $next($request);
            }
            return response()->json([
                'success' => false,
                'message' => 'Company not found or inactive',
                'subdomain' => $forcedSubdomain
            ], 404);
        }

        // Resolve tenant by full domain first
        $host = strtolower($request->getHost());
        $domainCandidates = $this->getDomainCandidates($host);
        $company = Company::whereIn('domain', $domainCandidates)
            ->where('status', 'active')
            ->first();

        if ($company) {
            app()->instance('tenant', $company);
            config(['tenant.id' => $company->id]);
            config(['tenant.company' => $company]);
            return $next($request);
        }

        // Fallback: Extract subdomain from host
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

        // If host is an IP, don't treat first octet as subdomain
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return null;
        }

        // Handle CRM URL format: crmopp.gashwa.com -> extract "gashwa"
        // If first part is "crmopp", skip it and use the second part
        if (count($parts) > 2 && $parts[0] === 'crmopp') {
            return $parts[1]; // Return the actual subdomain after "crmopp"
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

            // If not provided, try to infer from Origin header (e.g., http://gashwa.localhost:3000)
            if (!$subdomain) {
                $origin = request()->header('Origin');
                if ($origin) {
                    $originHost = parse_url($origin, PHP_URL_HOST);
                    if ($originHost && str_ends_with($originHost, '.localhost')) {
                        $originParts = explode('.', $originHost);
                        if (count($originParts) > 1 && $originParts[0] !== 'localhost') {
                            $subdomain = $originParts[0];
                        }
                    }
                }
            }

            // Also try to extract from host if it's like company1.localhost or crmopp.company1.localhost
            if (!$subdomain && str_contains($host, '.')) {
                $hostParts = explode('.', $host);
                if (count($hostParts) > 1 && $hostParts[0] !== 'www') {
                    // If first part is "crmopp", use second part
                    if ($hostParts[0] === 'crmopp' && count($hostParts) > 2) {
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

    /**
     * Build possible domain matches for a host.
     *
     * @param string $host
     * @return array
     */
    private function getDomainCandidates(string $host): array
    {
        $host = preg_replace('/:\d+$/', '', $host);
        $host = strtolower($host);
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
}

