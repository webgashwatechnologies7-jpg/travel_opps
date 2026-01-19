<?php

namespace App\Traits;

use Illuminate\Http\Request;

trait RequestSanitizer
{
    /**
     * Sanitize string input
     */
    protected function sanitizeString($input): string
    {
        if (is_null($input)) {
            return '';
        }
        
        return htmlspecialchars(strip_tags(trim($input)), ENT_QUOTES, 'UTF-8');
    }

    /**
     * Sanitize email input
     */
    protected function sanitizeEmail($input): string
    {
        if (is_null($input)) {
            return '';
        }
        
        return strtolower(filter_var(trim($input), FILTER_SANITIZE_EMAIL));
    }

    /**
     * Sanitize phone input
     */
    protected function sanitizePhone($input): string
    {
        if (is_null($input)) {
            return '';
        }
        
        // Remove all non-numeric characters except +, -, (, )
        return preg_replace('/[^0-9+\-\(\)\s]/', '', trim($input));
    }

    /**
     * Sanitize numeric input
     */
    protected function sanitizeNumeric($input): float
    {
        if (is_null($input)) {
            return 0;
        }
        
        return (float) filter_var($input, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    }

    /**
     * Sanitize integer input
     */
    protected function sanitizeInteger($input): int
    {
        if (is_null($input)) {
            return 0;
        }
        
        return (int) filter_var($input, FILTER_SANITIZE_NUMBER_INT);
    }

    /**
     * Sanitize URL input
     */
    protected function sanitizeUrl($input): string
    {
        if (is_null($input)) {
            return '';
        }
        
        return filter_var(trim($input), FILTER_SANITIZE_URL);
    }

    /**
     * Sanitize array of strings
     */
    protected function sanitizeArray($array): array
    {
        if (!is_array($array)) {
            return [];
        }
        
        return array_map([$this, 'sanitizeString'], $array);
    }

    /**
     * Sanitize request data based on rules
     */
    protected function sanitizeRequest(Request $request, array $rules): array
    {
        $sanitized = [];
        
        foreach ($rules as $field => $rule) {
            $value = $request->input($field);
            
            switch ($rule) {
                case 'string':
                    $sanitized[$field] = $this->sanitizeString($value);
                    break;
                case 'email':
                    $sanitized[$field] = $this->sanitizeEmail($value);
                    break;
                case 'phone':
                    $sanitized[$field] = $this->sanitizePhone($value);
                    break;
                case 'numeric':
                    $sanitized[$field] = $this->sanitizeNumeric($value);
                    break;
                case 'integer':
                    $sanitized[$field] = $this->sanitizeInteger($value);
                    break;
                case 'url':
                    $sanitized[$field] = $this->sanitizeUrl($value);
                    break;
                case 'array':
                    $sanitized[$field] = $this->sanitizeArray($value);
                    break;
                default:
                    $sanitized[$field] = $this->sanitizeString($value);
                    break;
            }
        }
        
        return $sanitized;
    }

    /**
     * Validate and sanitize email format
     */
    protected function isValidEmail($email): bool
    {
        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    /**
     * Validate and sanitize URL format
     */
    protected function isValidUrl($url): bool
    {
        return filter_var($url, FILTER_VALIDATE_URL) !== false;
    }

    /**
     * Check for XSS patterns
     */
    protected function containsXSS($input): bool
    {
        $xssPatterns = [
            '<script',
            'javascript:',
            'onload=',
            'onerror=',
            'onclick=',
            'onmouseover=',
            '<iframe',
            'eval(',
            'expression(',
        ];
        
        foreach ($xssPatterns as $pattern) {
            if (stripos($input, $pattern) !== false) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Clean SQL injection patterns
     */
    protected function cleanSqlInjection($input): string
    {
        $sqlPatterns = [
            '/(\s|^)(UNION|SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)(\s|$)/i',
            '/(\s|^)(OR|AND)\s+\d+\s*=\s*\d+/i',
            '/(\s|^)(OR|AND)\s+["\']?\w+["\']?\s*=\s*["\']?\w+["\']?/i',
        ];
        
        foreach ($sqlPatterns as $pattern) {
            $input = preg_replace($pattern, '', $input);
        }
        
        return $input;
    }
}
