<?php

namespace App\Exceptions;

use App\Traits\StandardApiResponse;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    use StandardApiResponse;
    /**
     * A list of exception types with their corresponding custom log levels.
     *
     * @var array<class-string<\Throwable>, \Psr\Log\LogLevel::*>
     */
    protected $levels = [
        //
    ];

    /**
     * A list of the exception types that are not reported.
     *
     * @var array<int, class-string<\Throwable>>
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $e)
    {
        if ($this->wantsJson($request)) {
            return $this->renderApiException($request, $e);
        }

        return parent::render($request, $e);
    }

    /**
     * Determine if the request expects a JSON / API response.
     */
    protected function wantsJson($request): bool
    {
        return $request->expectsJson() || $request->is('api/*');
    }

    /**
     * Render exceptions for API / JSON requests in a standard format.
     */
    protected function renderApiException($request, Throwable $e): JsonResponse
    {
        // Validation errors
        if ($e instanceof ValidationException) {
            return $this->validationErrorResponse($e->validator);
        }

        // Authentication / Authorization
        if ($e instanceof AuthenticationException) {
            return $this->unauthorizedResponse('Unauthenticated.');
        }

        if ($e instanceof AuthorizationException) {
            return $this->forbiddenResponse($e->getMessage() ?: 'This action is unauthorized.');
        }

        // Not found (route or model)
        if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
            return $this->notFoundResponse('Resource not found.');
        }

        // HTTP exceptions with custom status codes (404, 403, 429, etc.)
        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
            $message = $e->getMessage() ?: 'HTTP error';

            return $this->errorResponse($message, $status);
        }

        // Fallback: internal server error
        return $this->serverErrorResponse('An unexpected error occurred', $e);
    }
}
