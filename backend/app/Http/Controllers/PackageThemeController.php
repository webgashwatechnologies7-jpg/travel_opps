<?php

namespace App\Http\Controllers;

use App\Models\PackageTheme;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class PackageThemeController extends Controller
{
    /**
     * Get all package themes.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $packageThemes = PackageTheme::with('creator')
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($packageTheme) {
                    return [
                        'id' => $packageTheme->id,
                        'name' => $packageTheme->name,
                        'icon' => $packageTheme->icon ? asset('storage/' . $packageTheme->icon) : null,
                        'status' => $packageTheme->status,
                        'created_by' => $packageTheme->created_by,
                        'created_by_name' => $packageTheme->creator ? $packageTheme->creator->name : 'Travbizz Travel IT Solutions',
                        'last_update' => $packageTheme->updated_at ? $packageTheme->updated_at->format('d-m-Y') : null,
                        'updated_at' => $packageTheme->updated_at,
                        'created_at' => $packageTheme->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Package themes retrieved successfully',
                'data' => $packageThemes,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving package themes',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new package theme.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Handle file upload
            $iconPath = null;
            if ($request->hasFile('icon')) {
                $file = $request->file('icon');
                $iconPath = $file->store('package-themes', 'public');
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'icon' => 'nullable|image|max:2048',
                'status' => 'nullable|in:active,inactive',
            ], [
                'name.required' => 'The theme name field is required.',
                'icon.image' => 'The icon must be an image.',
                'icon.max' => 'The icon must not be greater than 2MB.',
            ]);

            if ($validator->fails()) {
                // Delete uploaded file if validation fails
                if ($iconPath && Storage::disk('public')->exists($iconPath)) {
                    Storage::disk('public')->delete($iconPath);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $packageTheme = PackageTheme::create([
                'name' => $request->name,
                'icon' => $iconPath,
                'status' => $request->status ?? 'active',
                'created_by' => $request->user()->id,
            ]);

            $packageTheme->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Package theme created successfully',
                'data' => [
                    'id' => $packageTheme->id,
                    'name' => $packageTheme->name,
                    'icon' => $packageTheme->icon ? asset('storage/' . $packageTheme->icon) : null,
                    'status' => $packageTheme->status,
                    'created_by' => $packageTheme->created_by,
                    'created_by_name' => $packageTheme->creator ? $packageTheme->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $packageTheme->updated_at ? $packageTheme->updated_at->format('d-m-Y') : null,
                    'updated_at' => $packageTheme->updated_at,
                    'created_at' => $packageTheme->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating package theme',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific package theme.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $packageTheme = PackageTheme::with('creator')->find($id);

            if (!$packageTheme) {
                return response()->json([
                    'success' => false,
                    'message' => 'Package theme not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Package theme retrieved successfully',
                'data' => [
                    'id' => $packageTheme->id,
                    'name' => $packageTheme->name,
                    'icon' => $packageTheme->icon ? asset('storage/' . $packageTheme->icon) : null,
                    'status' => $packageTheme->status,
                    'created_by' => $packageTheme->created_by,
                    'created_by_name' => $packageTheme->creator ? $packageTheme->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $packageTheme->updated_at ? $packageTheme->updated_at->format('d-m-Y') : null,
                    'updated_at' => $packageTheme->updated_at,
                    'created_at' => $packageTheme->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving package theme',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a package theme.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $packageTheme = PackageTheme::find($id);

            if (!$packageTheme) {
                return response()->json([
                    'success' => false,
                    'message' => 'Package theme not found',
                ], 404);
            }

            // Handle file upload
            $iconPath = $packageTheme->icon;
            if ($request->hasFile('icon')) {
                // Delete old icon if exists
                if ($iconPath && Storage::disk('public')->exists($iconPath)) {
                    Storage::disk('public')->delete($iconPath);
                }
                
                $file = $request->file('icon');
                $iconPath = $file->store('package-themes', 'public');
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'icon' => 'nullable|image|max:2048',
                'status' => 'sometimes|in:active,inactive',
            ], [
                'name.required' => 'The theme name field is required.',
                'icon.image' => 'The icon must be an image.',
                'icon.max' => 'The icon must not be greater than 2MB.',
            ]);

            if ($validator->fails()) {
                // Delete uploaded file if validation fails
                if ($request->hasFile('icon') && $iconPath && Storage::disk('public')->exists($iconPath)) {
                    Storage::disk('public')->delete($iconPath);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $packageTheme->update([
                'name' => $request->has('name') ? $request->name : $packageTheme->name,
                'icon' => $iconPath,
                'status' => $request->has('status') ? $request->status : $packageTheme->status,
            ]);

            $packageTheme->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Package theme updated successfully',
                'data' => [
                    'id' => $packageTheme->id,
                    'name' => $packageTheme->name,
                    'icon' => $packageTheme->icon ? asset('storage/' . $packageTheme->icon) : null,
                    'status' => $packageTheme->status,
                    'created_by' => $packageTheme->created_by,
                    'created_by_name' => $packageTheme->creator ? $packageTheme->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $packageTheme->updated_at ? $packageTheme->updated_at->format('d-m-Y') : null,
                    'updated_at' => $packageTheme->updated_at,
                    'created_at' => $packageTheme->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating package theme',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a package theme.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $packageTheme = PackageTheme::find($id);

            if (!$packageTheme) {
                return response()->json([
                    'success' => false,
                    'message' => 'Package theme not found',
                ], 404);
            }

            // Delete icon file if exists
            if ($packageTheme->icon && Storage::disk('public')->exists($packageTheme->icon)) {
                Storage::disk('public')->delete($packageTheme->icon);
            }

            $packageTheme->delete();

            return response()->json([
                'success' => true,
                'message' => 'Package theme deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting package theme',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

