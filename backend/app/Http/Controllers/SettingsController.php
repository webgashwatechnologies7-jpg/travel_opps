<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class SettingsController extends Controller
{
    /**
     * Get all settings or a specific setting
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $key = $request->input('key');
            
            if ($key) {
                $setting = Setting::where('key', $key)->first();
                if (!$setting) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Setting not found',
                    ], 404);
                }
                
                return response()->json([
                    'success' => true,
                    'data' => $setting,
                ], 200);
            }

            $settings = Setting::all();
            return response()->json([
                'success' => true,
                'data' => $settings,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch settings',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update or create a setting
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'key' => 'required|string|max:255',
                'value' => 'nullable',
                'type' => 'nullable|in:string,integer,boolean,text',
                'description' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $setting = Setting::setValue(
                $request->key,
                $request->value,
                $request->type ?? 'string',
                $request->description
            );

            return response()->json([
                'success' => true,
                'message' => 'Setting saved successfully',
                'data' => $setting,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to save setting',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get max hotel options setting
     */
    public function getMaxHotelOptions(): JsonResponse
    {
        try {
            // Check if setting exists, if not create default
            $setting = Setting::where('key', 'max_hotel_options')->first();
            if (!$setting) {
                Setting::setValue('max_hotel_options', '4', 'integer', 'Maximum number of hotel options allowed per day in itinerary');
                $maxOptions = 4;
            } else {
                $maxOptions = Setting::getValue('max_hotel_options', 4);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'max_hotel_options' => (int) $maxOptions,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch max hotel options',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Upload company logo
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $file = $request->file('logo');
            $logoPath = $file->store('logos', 'public');
            $logoUrl = url('storage/' . $logoPath);

            // Save logo URL to settings
            Setting::setValue('company_logo', $logoUrl, 'string', 'Company logo URL');

            return response()->json([
                'success' => true,
                'message' => 'Logo uploaded successfully',
                'data' => [
                    'logo_url' => $logoUrl,
                    'logo_path' => $logoPath,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload logo',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
