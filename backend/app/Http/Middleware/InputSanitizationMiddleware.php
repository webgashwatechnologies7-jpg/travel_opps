<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class InputSanitizationMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Sanitize input data
        $sanitized = $this->sanitizeInput($request->all());
        
        // Replace request input with sanitized data
        $request->merge($sanitized);
        
        return $next($request);
    }
    
    /**
     * Sanitize input data recursively
     */
    private function sanitizeInput(array $input): array
    {
        $sanitized = [];
        
        foreach ($input as $key => $value) {
            if (is_array($value)) {
                $sanitized[$key] = $this->sanitizeInput($value);
            } elseif (is_string($value)) {
                // Remove potential XSS and SQL injection patterns
                $sanitized[$key] = $this->cleanString($value);
            } else {
                $sanitized[$key] = $value;
            }
        }
        
        return $sanitized;
    }
    
    /**
     * Clean string from potential attacks
     */
    private function cleanString(string $string): string
    {
        // Remove HTML tags
        $string = strip_tags($string);
        
        // Remove special characters that could be used in attacks
        $string = htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
        
        // Remove SQL injection patterns
        $patterns = [
            '/(\s|^)(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)/i',
            '/(\s|^)(OR|AND)\s+\d+\s*=\s*\d+/i',
            '/(\s|^)(OR|AND)\s+["\']?\w+["\']?\s*=\s*["\']?\w+["\']?/i',
            '/--/',
            '/\/\*.*?\*\//',
            '/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/mi'
        ];
        
        foreach ($patterns as $pattern) {
            $string = preg_replace($pattern, '', $string);
        }
        
        return trim($string);
    }
}
