<?php

namespace App\Modules\Crm\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CompanySettings;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CompanySettingsController extends Controller
{
    /**
     * Get current company settings.
     *
     * @return JsonResponse
     */
    public function show(): JsonResponse
    {
        try {
            $settings = CompanySettings::getSettings();
            
            return response()->json([
                'success' => true,
                'data' => [
                    'sidebar_color' => $settings->sidebar_color,
                    'dashboard_background_color' => $settings->dashboard_background_color,
                    'header_background_color' => $settings->header_background_color,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update company settings.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function update(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'sidebar_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'dashboard_background_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
                'header_background_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/',
            ], [
                'sidebar_color.regex' => 'Sidebar color must be a valid hex color code (e.g., #2765B0)',
                'dashboard_background_color.regex' => 'Dashboard background color must be a valid hex color code (e.g., #D8DEF5)',
                'header_background_color.regex' => 'Header background color must be a valid hex color code (e.g., #D8DEF5)',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $settings = CompanySettings::getSettings();
            
            // Update only provided fields
            if ($request->has('sidebar_color')) {
                $settings->sidebar_color = $request->sidebar_color;
            }
            if ($request->has('dashboard_background_color')) {
                $settings->dashboard_background_color = $request->dashboard_background_color;
            }
            if ($request->has('header_background_color')) {
                $settings->header_background_color = $request->header_background_color;
            }
            
            $settings->save();

            return response()->json([
                'success' => true,
                'message' => 'Settings updated successfully',
                'data' => [
                    'sidebar_color' => $settings->sidebar_color,
                    'dashboard_background_color' => $settings->dashboard_background_color,
                    'header_background_color' => $settings->header_background_color,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reset settings to default values.
     *
     * @return JsonResponse
     */
    public function reset(): JsonResponse
    {
        try {
            $settings = CompanySettings::getSettings();
            
            $settings->sidebar_color = '#2765B0';
            $settings->dashboard_background_color = '#D8DEF5';
            $settings->header_background_color = '#D8DEF5';
            $settings->save();

            return response()->json([
                'success' => true,
                'message' => 'Settings reset to default values',
                'data' => [
                    'sidebar_color' => $settings->sidebar_color,
                    'dashboard_background_color' => $settings->dashboard_background_color,
                    'header_background_color' => $settings->header_background_color,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

