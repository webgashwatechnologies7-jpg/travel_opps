<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;

trait StandardApiResponse
{
    /**
     * Standard success response
     */
    protected function successResponse($data = null, $message = 'Operation successful', $statusCode = 200): JsonResponse
    {
        $response = [
            'success' => true,
            'message' => $message,
        ];

        if ($data !== null) {
            $response['data'] = $data;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Standard error response
     */
    protected function errorResponse($message = 'Operation failed', $statusCode = 400, $errors = null, $debugInfo = null): JsonResponse
    {
        $response = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        if ($debugInfo !== null && config('app.debug')) {
            $response['error'] = $debugInfo;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Validation error response
     */
    protected function validationErrorResponse($validator, $message = 'Validation failed'): JsonResponse
    {
        return $this->errorResponse($message, 422, $validator->errors());
    }

    /**
     * Not found response
     */
    protected function notFoundResponse($message = 'Resource not found'): JsonResponse
    {
        return $this->errorResponse($message, 404);
    }

    /**
     * Unauthorized response
     */
    protected function unauthorizedResponse($message = 'Unauthorized'): JsonResponse
    {
        return $this->errorResponse($message, 401);
    }

    /**
     * Forbidden response
     */
    protected function forbiddenResponse($message = 'Forbidden'): JsonResponse
    {
        return $this->errorResponse($message, 403);
    }

    /**
     * Server error response
     */
    protected function serverErrorResponse($message = 'Internal server error', $exception = null): JsonResponse
    {
        return $this->errorResponse($message, 500, null, $exception?->getMessage());
    }

    /**
     * Created response
     */
    protected function createdResponse($data = null, $message = 'Resource created successfully'): JsonResponse
    {
        return $this->successResponse($data, $message, 201);
    }

    /**
     * Updated response
     */
    protected function updatedResponse($data = null, $message = 'Resource updated successfully'): JsonResponse
    {
        return $this->successResponse($data, $message);
    }

    /**
     * Deleted response
     */
    protected function deletedResponse($message = 'Resource deleted successfully'): JsonResponse
    {
        return $this->successResponse(null, $message);
    }
}
