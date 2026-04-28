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
        $startTime = microtime(true);
        
        $response = $next($request);
        
        // Add response time header for monitoring
        $duration = round((microtime(true) - $startTime) * 1000, 2);
        $response->headers->set('X-Response-Time', $duration . 'ms');
        
        return $response;
    }
}
