<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;

class PerformanceMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Add response headers for better caching
        $response = $next($request);
        
        // Add caching headers for GET requests
        if ($request->isMethod('GET')) {
            $response->headers->set('Cache-Control', 'public, max-age=300');
        }
        
        // Log slow queries (can be enhanced with actual query time tracking)
        $startTime = microtime(true);
        
        return $response;
    }
}
