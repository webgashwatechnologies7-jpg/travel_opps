<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CompanyGoogleController extends Controller
{
    /**
     * Get Google (Gmail) settings for company.
     */
    public function getSettings(Request $request): JsonResponse
    {
        try {
            $company = auth()->user()->company;

            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Google settings retrieved successfully',
                'data' => [
                    'company_id' => $company->id,
                    'company_name' => $company->name,
                    'google_client_id' => $company->google_client_id,
                    'google_client_secret' => $company->google_client_secret,
                    'google_redirect_uri' => $company->google_redirect_uri,
                    'google_enabled' => $company->google_enabled,
                    'google_status' => $company->google_status,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Get Google settings error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve settings',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Update Google (Gmail) settings manually.
     */
    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $validator = validator($request->all(), [
                'google_client_id' => 'nullable|string|max:255',
                'google_client_secret' => 'nullable|string|max:255',
                'google_redirect_uri' => 'nullable|string|max:255',
                'google_enabled' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $company = auth()->user()->company;

            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found'
                ], 404);
            }

            $company->update([
                'google_client_id' => $request->input('google_client_id'),
                'google_client_secret' => $request->input('google_client_secret'),
                'google_redirect_uri' => $request->input('google_redirect_uri'),
                'google_enabled' => $request->boolean('google_enabled'),
                'google_status' => $request->filled('google_client_id') ? 'active' : 'not_configured',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Google settings updated successfully'
            ]);
        } catch (\Exception $e) {
            Log::error('Update Google settings error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
