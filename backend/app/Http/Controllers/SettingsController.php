<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\CompanySettings;
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
            // Enhanced validation for optional key parameter
            $validator = Validator::make($request->all(), [
                'key' => 'nullable|string|max:255'
            ]);

            if ($validator->fails()) {
                \Log::warning('Settings index validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $key = $request->input('key');

            if ($key) {
                try {
                    $setting = Setting::where('key', $key)->first();

                    if (!$setting) {
                        \Log::warning('Setting not found', [
                            'key' => $key,
                            'user_id' => auth()->id()
                        ]);

                        return response()->json([
                            'success' => false,
                            'message' => 'Setting not found',
                        ], 404);
                    }

                    \Log::info('Setting retrieved successfully', [
                        'key' => $key,
                        'setting_id' => $setting->id,
                        'user_id' => auth()->id()
                    ]);

                    return response()->json([
                        'success' => true,
                        'data' => $setting,
                    ], 200);

                } catch (\Exception $dbError) {
                    \Log::error('Database error fetching setting', [
                        'error' => $dbError->getMessage(),
                        'key' => $key,
                        'user_id' => auth()->id()
                    ]);

                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to fetch setting',
                        'error' => config('app.debug') ? $dbError->getMessage() : 'Database error'
                    ], 500);
                }
            }

            // Get all settings with error handling
            try {
                $settings = Setting::orderBy('key')->get();

                // Merge company-specific theme colors if user is not super admin
                $user = auth()->user();
                if ($user && $user->company_id) {
                    $companySettings = CompanySettings::where('company_id', $user->company_id)->first();
                    if ($companySettings) {
                        $settingsArray = $settings->toArray();
                        $themeKeys = ['sidebar_color', 'sidebar_color1', 'sidebar_color2', 'dashboard_background_color', 'header_background_color'];
                        
                        foreach ($themeKeys as $tKey) {
                            $found = false;
                            foreach ($settingsArray as &$s) {
                                if ($s['key'] === $tKey) {
                                    $s['value'] = $companySettings->$tKey ?? $s['value'];
                                    $found = true;
                                    break;
                                }
                            }
                            if (!$found && isset($companySettings->$tKey)) {
                                $settingsArray[] = [
                                    'key' => $tKey,
                                    'value' => $companySettings->$tKey,
                                    'type' => 'string'
                                ];
                            }
                        }
                        
                        \Log::info('All settings retrieved with company themes', [
                            'company_id' => $user->company_id,
                            'user_id' => $user->id
                        ]);
                        
                        return response()->json([
                            'success' => true,
                            'data' => $settingsArray,
                        ], 200);
                    }
                }

                \Log::info('All settings retrieved successfully', [
                    'settings_count' => $settings->count(),
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => true,
                    'data' => $settings,
                ], 200);

            } catch (\Exception $dbError) {
                \Log::error('Database error fetching all settings', [
                    'error' => $dbError->getMessage(),
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch settings',
                    'error' => config('app.debug') ? $dbError->getMessage() : 'Database error'
                ], 500);
            }

        } catch (\Exception $e) {
            \Log::error('Critical error in settings index', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch settings',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Update or create a setting
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Enhanced validation
            $validator = Validator::make($request->all(), [
                'key' => 'required|string|max:255',
                'value' => 'nullable|string|max:10000',
                'type' => 'required|in:string,integer,boolean,text',
                'description' => 'nullable|string|max:1000'
            ], [
                'key.required' => 'Setting key is required.',
                'key.max' => 'Setting key must not exceed 255 characters.',
                'value.max' => 'Setting value must not exceed 10000 characters.',
                'type.required' => 'Setting type is required.',
                'type.in' => 'Setting type must be one of: string, integer, boolean, text.',
                'description.max' => 'Description must not exceed 1000 characters.'
            ]);

            if ($validator->fails()) {
                \Log::warning('Settings store validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Validate setting value based on type
            $value = $request->value;
            $type = $request->type;

            if ($type === 'integer' && $value !== null && !is_numeric($value)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid integer value for setting type',
                ], 422);
            }

            if ($type === 'boolean' && $value !== null) {
                $value = filter_var($value, FILTER_VALIDATE_BOOLEAN);
            }

            // Create or update setting with database error handling
            try {
                $setting = Setting::setValue(
                    $request->key,
                    $value,
                    $type,
                    $request->description
                );

                \Log::info('Setting saved successfully', [
                    'key' => $request->key,
                    'setting_id' => $setting->id,
                    'type' => $type,
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Setting saved successfully',
                    'data' => $setting,
                ], 201);

            } catch (\Exception $dbError) {
                \Log::error('Database error saving setting', [
                    'error' => $dbError->getMessage(),
                    'key' => $request->key,
                    'value' => $request->value,
                    'type' => $type,
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save setting',
                    'error' => config('app.debug') ? $dbError->getMessage() : 'Database error'
                ], 500);
            }

        } catch (\Exception $e) {
            \Log::error('Critical error in settings store', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save setting',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Update multiple settings at once
     */
    public function update(Request $request): JsonResponse
    {
        try {
            $data = $request->all();

            if (empty($data)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No settings provided',
                ], 422);
            }

            $updated = [];
            $errors = [];

            // Define allowed settings and their types
            $allowedSettings = [
                'company_name' => 'string',
                'company_address' => 'text',
                'company_phone' => 'string',
                'company_email' => 'string',
                'company_website' => 'string',
                'company_logo' => 'string',
                'sidebar_color' => 'string',
                'sidebar_color1' => 'string',
                'sidebar_color2' => 'string',
                'dashboard_background_color' => 'string',
                'header_background_color' => 'string',
            ];

            $user = auth()->user();
            $themeKeys = ['sidebar_color', 'sidebar_color1', 'sidebar_color2', 'dashboard_background_color', 'header_background_color'];
            $companySettings = null;
            if ($user && $user->company_id) {
                $companySettings = CompanySettings::where('company_id', $user->company_id)->first();
            }

            foreach ($data as $key => $value) {
                if (!array_key_exists($key, $allowedSettings)) {
                    continue; // Skip unknown settings
                }

                try {
                    // Update company settings if it's a theme key and user is not super admin
                    if ($companySettings && in_array($key, $themeKeys)) {
                        $dbKey = $key;
                        // Map sidebar_color1/2 to sidebar_color if needed
                        if ($key === 'sidebar_color1' || $key === 'sidebar_color2') $dbKey = 'sidebar_color';
                        
                        $companySettings->update([$dbKey => $value]);
                        $updated[] = $key;
                        continue;
                    }

                    $type = $allowedSettings[$key];
                    $description = ucwords(str_replace('_', ' ', $key));

                    Setting::setValue($key, $value, $type, $description);
                    $updated[] = $key;
                } catch (\Exception $e) {
                    \Log::error("Failed to update setting: {$key}", [
                        'error' => $e->getMessage(),
                        'user_id' => auth()->id()
                    ]);
                    $errors[$key] = $e->getMessage();
                }
            }

            if (empty($updated) && !empty($errors)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update settings',
                    'errors' => $errors,
                ], 500);
            }

            \Log::info('Settings updated successfully', [
                'updated_count' => count($updated),
                'updated_keys' => $updated,
                'user_id' => auth()->id()
            ]);

            // Return all settings
            $settings = Setting::orderBy('key')->get();

            return response()->json([
                'success' => true,
                'message' => 'Settings updated successfully',
                'data' => $settings,
                'updated' => $updated,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Critical error in settings update', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
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
            try {
                $setting = Setting::where('key', 'max_hotel_options')->first();
                if (!$setting) {
                    \Log::info('Creating default max hotel options setting', [
                        'user_id' => auth()->id()
                    ]);

                    Setting::setValue('max_hotel_options', '4', 'integer', 'Maximum number of hotel options allowed per day in itinerary');
                    $maxOptions = 4;
                } else {
                    $maxOptions = Setting::getValue('max_hotel_options', 4);

                    // Validate setting value
                    if (!is_numeric($maxOptions) || $maxOptions < 1 || $maxOptions > 20) {
                        \Log::warning('Invalid max hotel options setting', [
                            'current_value' => $maxOptions,
                            'user_id' => auth()->id()
                        ]);

                        // Reset to default if invalid
                        Setting::setValue('max_hotel_options', '4', 'integer', 'Maximum number of hotel options allowed per day in itinerary');
                        $maxOptions = 4;
                    }
                }

                \Log::info('Max hotel options retrieved successfully', [
                    'value' => $maxOptions,
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => true,
                    'data' => [
                        'max_hotel_options' => (int) $maxOptions,
                    ],
                ], 200);

            } catch (\Exception $dbError) {
                \Log::error('Database error fetching max hotel options', [
                    'error' => $dbError->getMessage(),
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch max hotel options',
                    'error' => config('app.debug') ? $dbError->getMessage() : 'Database error'
                ], 500);
            }

        } catch (\Exception $e) {
            \Log::error('Critical error in getMaxHotelOptions', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch max hotel options',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Upload company logo
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        \Log::debug('Logo Upload Attempt', ['files' => $request->allFiles()]);
        try {
            $validator = Validator::make($request->all(), [
                'logo' => 'required|image|mimes:jpeg,png,jpg,gif,svg,webp|max:10240',
            ]);

            if ($validator->fails()) {
                \Log::warning('Logo upload validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'user_id' => auth()->id()
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed: ' . implode(', ', $validator->errors()->all()),
                    'errors' => $validator->errors(),
                ], 422);
            }

            $file = $request->file('logo');
            $isFavicon = $request->boolean('is_favicon', false);
            $folder = $isFavicon ? 'favicons' : 'logos';
            $fileName = $isFavicon ? 'favicon' : 'logo';
            
            $path = $file->store($folder, 'public');
            $url = url('storage/' . $path);

            // ONLY Save to global settings if user is super admin
            if (auth()->user()?->is_super_admin) {
                $settingKey = $isFavicon ? 'company_favicon' : 'company_logo';
                Setting::setValue($settingKey, $url, 'string', $isFavicon ? 'Company favicon URL' : 'Company logo URL');
            }

            return response()->json([
                'success' => true,
                'message' => 'Logo uploaded successfully',
                'data' => [
                    'logo_url' => $url,
                    'logo_path' => $path,
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

    /**
     * Get company details for the authenticated user
     */
    public function getCompanyDetails(): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not associated with any company',
                ], 404);
            }

            $company = \App\Models\Company::find($user->company_id);

            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found',
                ], 404);
            }

            // Auto-generate API key if it's missing for older companies
            if (empty($company->api_key)) {
                $company->api_key = \Illuminate\Support\Str::random(32);
                $company->save();
            }

            // Include company theme colors
            $themeColors = CompanySettings::where('company_id', $company->id)->first();

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'email' => $company->email,
                    'phone' => $company->phone,
                    'address' => $company->address,
                    'logo' => $company->logo,
                    'favicon' => $company->favicon,
                    'subdomain' => $company->subdomain,
                    'domain' => $company->domain,
                    'status' => $company->status,
                    'api_key' => $company->api_key,
                    'fb_page_id' => $company->fb_page_id,
                    'fb_page_access_token' => $company->fb_page_access_token,
                    'fb_ad_account_id' => $company->fb_ad_account_id,
                    'sidebar_color' => $themeColors->sidebar_color ?? '#2765B0',
                    'dashboard_background_color' => $themeColors->dashboard_background_color ?? '#D8DEF5',
                    'header_background_color' => $themeColors->header_background_color ?? '#D8DEF5',
                    'attendance_mode' => $themeColors->attendance_mode ?? 'flexible',
                    'allowed_ips' => $themeColors->allowed_ips ?? [],
                    'default_punch_in_time' => $themeColors->default_punch_in_time ?? '09:00',
                    'default_punch_out_time' => $themeColors->default_punch_out_time ?? '18:00',
                ],
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Failed to get company details', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get company details',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update company details for the authenticated user
     */
    public function updateCompanyDetails(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not associated with any company',
                ], 404);
            }

            $company = \App\Models\Company::find($user->company_id);

            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found',
                ], 404);
            }

            // Normalize request data: map company_ prefixed fields to backend expected keys
            $data = $request->all();
            $mappings = [
                'company_name' => 'name',
                'company_address' => 'address',
                'company_phone' => 'phone',
                'company_email' => 'email',
                'company_website' => 'website',
            ];
            
            foreach ($mappings as $prefixed => $direct) {
                if ($request->has($prefixed) && !$request->has($direct)) {
                    $data[$direct] = $request->input($prefixed);
                }
            }
            
            // Re-validate with normalized data
            $validator = Validator::make($data, [
                'name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:500',
                'logo' => 'nullable|string|max:500',
                'favicon' => 'nullable|string|max:500',
                'website' => 'nullable|string|max:255',
                'fb_page_id' => 'nullable|string|max:100',
                'fb_page_access_token' => 'nullable|string|max:2000',
                'fb_ad_account_id' => 'nullable|string|max:100',
                'sidebar_color' => 'nullable|string|max:20',
                'dashboard_background_color' => 'nullable|string|max:20',
                'header_background_color' => 'nullable|string|max:20',
                'attendance_mode' => 'nullable|string|in:fixed_ip,flexible,location_based',
                'allowed_ips' => 'nullable|array',
                'default_punch_in_time' => 'nullable|string|max:10',
                'default_punch_out_time' => 'nullable|string|max:10',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed: ' . implode(', ', $validator->errors()->all()),
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();

            // Robustly strip any full URL or /storage/ prefix to save only the relative path
            $stripUrlPrefix = function($url) {
                if (empty($url)) return $url;
                // Remove protocol and host if present
                $url = preg_replace('/^https?:\/\/[^\/]+/', '', $url);
                // Remove leading slash and storage prefix to get just the path after storage/
                $url = preg_replace('/^\/?storage\//', '', $url);
                $url = ltrim($url, '/');
                return $url;
            };

            if (!empty($validated['logo'])) {
                $validated['logo'] = $stripUrlPrefix($validated['logo']);
            }
            if (!empty($validated['favicon'])) {
                $validated['favicon'] = $stripUrlPrefix($validated['favicon']);
            }

            // Separate company and theme settings
            $companyData = array_intersect_key($validated, array_flip(['name', 'email', 'phone', 'address', 'logo', 'favicon', 'website', 'fb_page_id', 'fb_page_access_token', 'fb_ad_account_id']));
            $themeData = array_intersect_key($validated, array_flip(['sidebar_color', 'dashboard_background_color', 'header_background_color', 'attendance_mode', 'allowed_ips', 'default_punch_in_time', 'default_punch_out_time']));

            // Update company details (including null values for logo removal)
            $company->update($companyData);

            // Update theme colors if provided
            if (!empty($themeData)) {
                $companySettings = CompanySettings::where('company_id', $company->id)->first();
                if (!$companySettings) {
                    $companySettings = new CompanySettings();
                    $companySettings->company_id = $company->id;
                }
                $companySettings->fill($themeData);
                $companySettings->save();
            }

            \Log::info('Company details updated', [
                'company_id' => $company->id,
                'updated_fields' => array_keys(array_filter($validated)),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Company details updated successfully',
                'data' => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'email' => $company->email,
                    'phone' => $company->phone,
                    'address' => $company->address,
                    'logo' => $company->logo,
                    'favicon' => $company->favicon,
                    'fb_page_id' => $company->fb_page_id,
                    'sidebar_color' => $themeData['sidebar_color'] ?? ($companySettings->sidebar_color ?? null),
                    'dashboard_background_color' => $themeData['dashboard_background_color'] ?? ($companySettings->dashboard_background_color ?? null),
                    'header_background_color' => $themeData['header_background_color'] ?? ($companySettings->header_background_color ?? null),
                ],
            ], 200);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Failed to update company details', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update company details',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Upload payment QR code
     */
    public function uploadPaymentQrCode(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'qr_code' => 'required|image|mimes:jpeg,png,jpg,webp|max:5120',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed: ' . implode(', ', $validator->errors()->all()),
                    'errors' => $validator->errors(),
                ], 422);
            }

            $file = $request->file('qr_code');
            $path = $file->store('payment_qrs', 'public');
            $url = url('storage/' . $path);

            return response()->json([
                'success' => true,
                'message' => 'QR Code uploaded successfully',
                'data' => [
                    'qr_url' => $url,
                    'qr_path' => $path,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload QR code',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
