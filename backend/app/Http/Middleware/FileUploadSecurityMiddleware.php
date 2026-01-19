<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\Response;

class FileUploadSecurityMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Check if request contains file uploads
        if ($request->hasFile('file') || $request->hasFile('attachment') || $request->hasFile('image')) {
            $files = $request->files->all();
            
            foreach ($files as $fileArray) {
                if (is_array($fileArray)) {
                    foreach ($fileArray as $file) {
                        if ($file && $file->isValid()) {
                            $this->validateFile($file);
                        }
                    }
                } elseif ($fileArray && $fileArray->isValid()) {
                    $this->validateFile($fileArray);
                }
            }
        }
        
        return $next($request);
    }
    
    /**
     * Validate uploaded file for security
     */
    private function validateFile($file): void
    {
        // Check file size (max 10MB)
        $maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if ($file->getSize() > $maxSize) {
            abort(422, 'File size cannot exceed 10MB');
        }
        
        // Check file extension
        $allowedExtensions = [
            'jpg', 'jpeg', 'png', 'gif', 'webp', // Images
            'pdf', 'doc', 'docx', 'xls', 'xlsx', // Documents
            'csv', 'txt' // Data files
        ];
        
        $extension = strtolower($file->getClientOriginalExtension());
        if (!in_array($extension, $allowedExtensions)) {
            abort(422, 'File type not allowed');
        }
        
        // Check MIME type
        $allowedMimeTypes = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp',
            'application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/csv', 'text/plain'
        ];
        
        $mimeType = $file->getMimeType();
        if (!in_array($mimeType, $allowedMimeTypes)) {
            abort(422, 'Invalid file type');
        }
        
        // Scan for malicious content (basic check)
        $content = file_get_contents($file->getPathname());
        
        // Check for PHP tags
        if (preg_match('/<\?php/i', $content)) {
            abort(422, 'Malicious file detected');
        }
        
        // Check for JavaScript tags
        if (preg_match('/<script/i', $content)) {
            abort(422, 'Malicious file detected');
        }
        
        // Check for common webshell patterns
        $webshellPatterns = [
            '/eval\s*\(/i',
            '/exec\s*\(/i',
            '/system\s*\(/i',
            '/shell_exec\s*\(/i',
            '/passthru\s*\(/i',
            '/base64_decode\s*\(/i'
        ];
        
        foreach ($webshellPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                abort(422, 'Malicious file detected');
            }
        }
    }
}
