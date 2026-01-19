<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ApiErrorHandlerMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $response = $next($request);
            
            // Log API calls for monitoring
            Log::info('API Request', [
                'method' => $request->method(),
                'url' => $request->fullUrl(),
                'status' => $response->getStatusCode(),
                'user_id' => auth()->id(),
                'company_id' => auth()->user()?->company_id,
            ]);
            
            return $response;
        } catch (\Exception $e) {
            // Log the error
            Log::error('API Error', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
                'request' => [
                    'method' => $request->method(),
                    'url' => $request->fullUrl(),
                    'user_id' => auth()->id(),
                    'company_id' => auth()->user()?->company_id,
                ]
            ]);

            // Return standardized error response
            return response()->json([
                'success' => false,
                'message' => $this->getErrorMessage($e),
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                'code' => $this->getErrorCode($e)
            ], $this->getStatusCode($e));
        }
    }

    /**
     * Get user-friendly error message
     */
    private function getErrorMessage(\Exception $e): string
    {
        return match(true) {
            $e instanceof \Illuminate\Validation\ValidationException => 'Validation failed',
            $e instanceof \Illuminate\Auth\AuthenticationException => 'Authentication required',
            $e instanceof \Illuminate\Auth\Access\AuthorizationException => 'Access denied',
            $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException => 'Resource not found',
            $e instanceof \Illuminate\Database\QueryException => 'Database error occurred',
            default => 'An error occurred while processing your request'
        };
    }

    /**
     * Get error code for response
     */
    private function getErrorCode(\Exception $e): string
    {
        return match(true) {
            $e instanceof \Illuminate\Validation\ValidationException => 'VALIDATION_ERROR',
            $e instanceof \Illuminate\Auth\AuthenticationException => 'AUTH_ERROR',
            $e instanceof \Illuminate\Auth\Access\AuthorizationException => 'ACCESS_DENIED',
            $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException => 'NOT_FOUND',
            $e instanceof \Illuminate\Database\QueryException => 'DATABASE_ERROR',
            default => 'SERVER_ERROR'
        };
    }

    /**
     * Get HTTP status code
     */
    private function getStatusCode(\Exception $e): int
    {
        return match(true) {
            $e instanceof \Illuminate\Validation\ValidationException => 422,
            $e instanceof \Illuminate\Auth\AuthenticationException => 401,
            $e instanceof \Illuminate\Auth\Access\AuthorizationException => 403,
            $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException => 404,
            $e instanceof \Illuminate\Database\QueryException => 500,
            default => 500
        };
    }
}
