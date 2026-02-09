<?php

namespace App\Http\Controllers;

use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class PackageController extends Controller
{
    /**
     * Get all packages.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $packages = Package::with('creator')
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($package) {
                    return [
                        'id' => $package->id,
                        'title' => $package->itinerary_name,
                        'itinerary_name' => $package->itinerary_name,
                        'start_date' => $package->start_date ? $package->start_date->format('Y-m-d') : null,
                        'end_date' => $package->end_date ? $package->end_date->format('Y-m-d') : null,
                        'adult' => $package->adult,
                        'child' => $package->child,
                        'destinations' => $package->destinations,
                        'notes' => $package->notes,
                        'terms_conditions' => $package->terms_conditions,
                        'refund_policy' => $package->refund_policy,
                        'package_description' => $package->package_description,
                        'duration' => $package->duration,
                        'price' => $package->price,
                        'website_cost' => $package->website_cost,
                        'show_on_website' => $package->show_on_website,
                        'image' => $package->image ? url('storage/' . $package->image) : null,
                        'destination' => $package->destinations, // Alias for compatibility
                        'created_by' => $package->created_by,
                        'created_by_name' => $package->creator ? $package->creator->name : 'Travbizz Travel IT Solutions',
                        'last_updated' => $package->updated_at ? $package->updated_at->format('d-m-Y') : null,
                        'updated_at' => $package->updated_at,
                        'created_at' => $package->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Packages retrieved successfully',
                'data' => $packages,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving packages',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new package.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Handle file upload or use existing image from library (image_path)
            $imagePath = null;
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $imagePath = $file->store('packages', 'public');
            } elseif ($request->filled('image_path')) {
                $path = $request->input('image_path');
                if (preg_match('/^packages\/[a-zA-Z0-9_\-\.\/]+$/', $path) && Storage::disk('public')->exists($path)) {
                    $imagePath = $path;
                }
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'itinerary_name' => 'required|string|max:255',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'duration' => 'nullable|integer|min:1',
                'adult' => 'nullable|integer|min:0',
                'child' => 'nullable|integer|min:0',
                'destinations' => 'nullable|string',
                'notes' => 'nullable|string',
                'terms_conditions' => 'nullable|string',
                'refund_policy' => 'nullable|string',
                'package_description' => 'nullable|string',
                'price' => 'nullable|numeric|min:0',
                'website_cost' => 'nullable|numeric|min:0',
                'show_on_website' => 'nullable|boolean',
                'image' => 'nullable|mimes:jpeg,jpg,png,gif,bmp,webp,avif,svg|max:2048',
                'image_path' => 'nullable|string|max:500',
            ], [
                'itinerary_name.required' => 'The itinerary name field is required.',
                'end_date.after_or_equal' => 'The end date must be after or equal to start date.',
                'image.mimes' => 'The image must be a valid image file (jpeg, jpg, png, gif, bmp, webp, avif, svg).',
                'image.max' => 'The image must not be greater than 2MB.',
            ]);

            if ($validator->fails()) {
                // Delete uploaded file if validation fails
                if ($imagePath && Storage::disk('public')->exists($imagePath)) {
                    Storage::disk('public')->delete($imagePath);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();
            unset($data['image_path']);
            $data['created_by'] = $request->user()->id;
            $data['image'] = $imagePath;
            $data['adult'] = $data['adult'] ?? 1;
            $data['child'] = $data['child'] ?? 0;
            $data['price'] = $data['price'] ?? 0;
            $data['website_cost'] = $data['website_cost'] ?? 0;
            $data['show_on_website'] = $data['show_on_website'] ?? false;
            $data['duration'] = $data['duration'] ?? null;

            $package = Package::create($data);
            
            // Calculate duration from dates if not provided
            if ($package->start_date && $package->end_date && empty($data['duration'])) {
                $package->calculateDuration();
                $package->save();
            }

            $package->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Package created successfully',
                'data' => [
                    'id' => $package->id,
                    'title' => $package->itinerary_name,
                    'itinerary_name' => $package->itinerary_name,
                    'start_date' => $package->start_date ? $package->start_date->format('Y-m-d') : null,
                    'end_date' => $package->end_date ? $package->end_date->format('Y-m-d') : null,
                    'adult' => $package->adult,
                    'child' => $package->child,
                    'destinations' => $package->destinations,
                    'notes' => $package->notes,
                    'terms_conditions' => $package->terms_conditions,
                    'refund_policy' => $package->refund_policy,
                    'package_description' => $package->package_description,
                    'duration' => $package->duration,
                    'price' => $package->price,
                    'website_cost' => $package->website_cost,
                    'show_on_website' => $package->show_on_website,
                    'image' => $package->image ? url('storage/' . $package->image) : null,
                    'created_by_name' => $package->creator ? $package->creator->name : 'Travbizz Travel IT Solutions',
                    'last_updated' => $package->updated_at ? $package->updated_at->format('d-m-Y') : null,
                    'updated_at' => $package->updated_at,
                    'created_at' => $package->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            // Delete uploaded file if creation fails
            if (isset($imagePath) && $imagePath && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating package',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific package.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $package = Package::with('creator')->find($id);

            if (!$package) {
                return response()->json([
                    'success' => false,
                    'message' => 'Package not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Package retrieved successfully',
                'data' => [
                    'id' => $package->id,
                    'title' => $package->itinerary_name,
                    'itinerary_name' => $package->itinerary_name,
                    'start_date' => $package->start_date ? $package->start_date->format('Y-m-d') : null,
                    'end_date' => $package->end_date ? $package->end_date->format('Y-m-d') : null,
                    'adult' => $package->adult,
                    'child' => $package->child,
                    'destinations' => $package->destinations,
                    'notes' => $package->notes,
                    'terms_conditions' => $package->terms_conditions,
                    'refund_policy' => $package->refund_policy,
                    'package_description' => $package->package_description,
                    'duration' => $package->duration,
                    'price' => $package->price,
                    'website_cost' => $package->website_cost,
                    'show_on_website' => $package->show_on_website,
                    'image' => $package->image ? url('storage/' . $package->image) : null,
                    'created_by_name' => $package->creator ? $package->creator->name : 'Travbizz Travel IT Solutions',
                    'last_updated' => $package->updated_at ? $package->updated_at->format('d-m-Y') : null,
                    'updated_at' => $package->updated_at,
                    'created_at' => $package->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving package',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a package.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $package = Package::find($id);

            if (!$package) {
                return response()->json([
                    'success' => false,
                    'message' => 'Package not found',
                ], 404);
            }

            // Handle file upload or use existing image from library (image_path)
            $imagePath = $package->image;
            if ($request->hasFile('image')) {
                if ($package->image && Storage::disk('public')->exists($package->image)) {
                    Storage::disk('public')->delete($package->image);
                }
                $file = $request->file('image');
                $imagePath = $file->store('packages', 'public');
            } elseif ($request->filled('image_path')) {
                $path = $request->input('image_path');
                if (preg_match('/^packages\/[a-zA-Z0-9_\-\.\/]+$/', $path) && Storage::disk('public')->exists($path)) {
                    $imagePath = $path;
                }
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'itinerary_name' => 'sometimes|required|string|max:255',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'duration' => 'nullable|integer|min:1',
                'adult' => 'nullable|integer|min:0',
                'child' => 'nullable|integer|min:0',
                'destinations' => 'nullable|string',
                'notes' => 'nullable|string',
                'terms_conditions' => 'nullable|string',
                'refund_policy' => 'nullable|string',
                'package_description' => 'nullable|string',
                'price' => 'nullable|numeric|min:0',
                'website_cost' => 'nullable|numeric|min:0',
                'show_on_website' => 'nullable|boolean',
                'image' => 'nullable|mimes:jpeg,jpg,png,gif,bmp,webp,avif,svg|max:2048',
                'image_path' => 'nullable|string|max:500',
            ], [
                'itinerary_name.required' => 'The itinerary name field is required.',
                'end_date.after_or_equal' => 'The end date must be after or equal to start date.',
                'image.mimes' => 'The image must be a valid image file (jpeg, jpg, png, gif, bmp, webp, avif, svg).',
                'image.max' => 'The image must not be greater than 2MB.',
            ]);

            if ($validator->fails()) {
                // Delete uploaded file if validation fails
                if ($request->hasFile('image') && $imagePath && Storage::disk('public')->exists($imagePath)) {
                    Storage::disk('public')->delete($imagePath);
                }
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();
            unset($data['image_path']);
            $data['image'] = $imagePath;
            
            // Handle boolean conversion for show_on_website
            if ($request->has('show_on_website')) {
                $value = $request->input('show_on_website');
                // Convert various formats to boolean
                if (is_string($value)) {
                    $data['show_on_website'] = in_array(strtolower($value), ['true', '1', 'yes', 'on'], true);
                } elseif (is_numeric($value)) {
                    $data['show_on_website'] = (int)$value === 1;
                } else {
                    $data['show_on_website'] = (bool) $value;
                }
            }

            $package->update($data);
            
            // Recalculate duration from dates only if duration not provided
            if ($package->start_date && $package->end_date && !isset($data['duration'])) {
                $package->calculateDuration();
                $package->save();
            }

            $package->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Package updated successfully',
                'data' => [
                    'id' => $package->id,
                    'title' => $package->itinerary_name,
                    'itinerary_name' => $package->itinerary_name,
                    'start_date' => $package->start_date ? $package->start_date->format('Y-m-d') : null,
                    'end_date' => $package->end_date ? $package->end_date->format('Y-m-d') : null,
                    'adult' => $package->adult,
                    'child' => $package->child,
                    'destinations' => $package->destinations,
                    'notes' => $package->notes,
                    'terms_conditions' => $package->terms_conditions,
                    'refund_policy' => $package->refund_policy,
                    'package_description' => $package->package_description,
                    'duration' => $package->duration,
                    'price' => $package->price,
                    'website_cost' => $package->website_cost,
                    'show_on_website' => $package->show_on_website,
                    'image' => $package->image ? url('storage/' . $package->image) : null,
                    'created_by_name' => $package->creator ? $package->creator->name : 'Travbizz Travel IT Solutions',
                    'last_updated' => $package->updated_at ? $package->updated_at->format('d-m-Y') : null,
                    'updated_at' => $package->updated_at,
                    'created_at' => $package->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating package',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a package.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $package = Package::find($id);

            if (!$package) {
                return response()->json([
                    'success' => false,
                    'message' => 'Package not found',
                ], 404);
            }

            // Delete image if exists
            if ($package->image && Storage::disk('public')->exists($package->image)) {
                Storage::disk('public')->delete($package->image);
            }

            $package->delete();

            return response()->json([
                'success' => true,
                'message' => 'Package deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting package',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

