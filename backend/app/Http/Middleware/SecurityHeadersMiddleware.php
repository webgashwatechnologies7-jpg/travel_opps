<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeadersMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        // Security Headers
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        
        // Content Security Policy (CSP)
        $csp = "default-src 'self'; " .
                "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.google.com https://www.gstatic.com; " .
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " .
                "font-src 'self' https://fonts.gstatic.com; " .
                "img-src 'self' data: https:; " .
                "connect-src 'self' https://api.github.com; " .
                "frame-src 'none'; " .
                "object-src 'none';";
        
        $response->headers->set('Content-Security-Policy', $csp);
        
        // Remove server information
        $response->headers->set('Server', '');
        $response->headers->set('X-Powered-By', '');
        
        return $response;
    }
}
