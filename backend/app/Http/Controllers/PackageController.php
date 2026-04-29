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
            $query = Package::with('creator');

            // Default: show everything (Templates + Lead Specific)
            // Can still filter if explicitly requested
            if ($request->has('templates_only') && $request->boolean('templates_only')) {
                $query->whereNull('lead_id');
            } elseif ($request->has('proposals_only') && $request->boolean('proposals_only')) {
                $query->whereNotNull('lead_id');
            }

            $packages = $query->orderBy('updated_at', 'desc')
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
                        'infant' => $package->infant,
                        'destinations' => $package->destinations,
                        'routing' => $package->routing,
                        'notes' => $package->notes,
                        'terms_conditions' => $package->terms_conditions,
                        'refund_policy' => $package->refund_policy,
                        'package_description' => $package->package_description,
                        'confirmation_policy' => $package->confirmation_policy,
                        'amendment_policy' => $package->amendment_policy,
                        'payment_policy' => $package->payment_policy,
                        'remarks' => $package->remarks,
                        'thank_you_message' => $package->thank_you_message,
                        'duration' => $package->duration,
                        'price' => $package->price,
                        'website_cost' => $package->website_cost,
                        'show_on_website' => $package->show_on_website,
                        'image' => $package->image ? url('storage/' . $package->image) : null,
                        'day_events' => $package->day_events,
                        'days' => $package->days,
                        'options_data' => $package->options_data,
                        'destination' => $package->destinations, // Alias for compatibility
                        'created_by' => $package->created_by,
                        'created_by_name' => $package->creator ? $package->creator->name : 'Travbizz Travel IT Solutions',
                        'last_updated' => $package->updated_at ? $package->updated_at->format('d-m-Y') : null,
                        'updated_at' => $package->updated_at,
                        'created_at' => $package->created_at,
                        'lead_id' => $package->lead_id,
                    ];
                });

            $templateCount = Package::whereNull('lead_id')->count();
            $proposalCount = Package::whereNotNull('lead_id')->count();

            return response()->json([
                'success' => true,
                'message' => 'Packages retrieved successfully',
                'data' => $packages,
                'meta' => [
                    'template_count' => $templateCount,
                    'proposal_count' => $proposalCount,
                ]
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
                'infant' => 'nullable|integer|min:0',
                'destinations' => 'nullable|string',
                'routing' => 'nullable|string',
                'notes' => 'nullable|string',
                'terms_conditions' => 'nullable',
                'refund_policy' => 'nullable',
                'package_description' => 'nullable',
                'confirmation_policy' => 'nullable',
                'amendment_policy' => 'nullable',
                'payment_policy' => 'nullable',
                'remarks' => 'nullable',
                'thank_you_message' => 'nullable',
                'price' => 'nullable|numeric|min:0',
                'website_cost' => 'nullable|numeric|min:0',
                'show_on_website' => 'nullable|boolean',
                'image' => 'nullable|mimes:jpeg,jpg,png,gif,bmp,webp,avif,svg|max:2048',
                'image_path' => 'nullable|string|max:500',
                'day_events' => 'nullable|array',
                'days' => 'nullable|array',
                'options_data' => 'nullable|array',
                'inclusions' => 'nullable',
                'exclusions' => 'nullable',
                'lead_id' => 'nullable|integer',
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
            $data['infant'] = $data['infant'] ?? 0;
            $data['price'] = $data['price'] ?? 0;
            $data['website_cost'] = $data['website_cost'] ?? 0;
            // Handle boolean conversion for show_on_website
            if ($request->has('show_on_website')) {
                $value = $request->input('show_on_website');
                if (is_string($value)) {
                    $data['show_on_website'] = in_array(strtolower($value), ['true', '1', 'yes', 'on'], true);
                } elseif (is_numeric($value)) {
                    $data['show_on_website'] = (int)$value === 1;
                } else {
                    $data['show_on_website'] = (bool) $value;
                }
            } else {
                $data['show_on_website'] = true;
            }

            $data['duration'] = $data['duration'] ?? null;

            // Auto-fill master points if not provided
            $masterMapping = [
                'inclusions' => 'inclusion',
                'exclusions' => 'exclusion',
                'remarks' => 'remarks',
                'terms_conditions' => 'terms',
                'confirmation_policy' => 'confirmation',
                'refund_policy' => 'cancellation',
                'amendment_policy' => 'amendment',
                'payment_policy' => 'payment',
                'thank_you_message' => 'thank_you',
            ];

            $companyId = $request->header('X-Company-ID') ?: null;
            $masterPoints = \App\Models\MasterPoint::where('is_active', true)
                ->when($companyId, function ($query) use ($companyId) {
                    return $query->where('company_id', $companyId);
                })
                ->orderBy('sort_order')
                ->get()
                ->groupBy('type');

            foreach ($masterMapping as $packageField => $masterType) {
                if (empty($data[$packageField])) {
                    if (isset($masterPoints[$masterType]) && $masterPoints[$masterType]->count() > 0) {
                        $data[$packageField] = $masterPoints[$masterType]->pluck('content')->map(function($c) { return trim($c); })->toArray();
                    } else {
                        // Default to empty array if no master point found
                        $data[$packageField] = [];
                    }
                }
            }

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
                    'start_date' => $package->start_date ? \Carbon\Carbon::parse($package->start_date)->format('Y-m-d') : null,
                    'end_date' => $package->end_date ? \Carbon\Carbon::parse($package->end_date)->format('Y-m-d') : null,
                    'adult' => $package->adult,
                    'child' => $package->child,
                    'infant' => $package->infant,
                    'destinations' => $package->destinations,
                    'routing' => $package->routing,
                    'notes' => $package->notes,
                    'terms_conditions' => $package->terms_conditions,
                    'refund_policy' => $package->refund_policy,
                    'package_description' => $package->package_description,
                    'confirmation_policy' => $package->confirmation_policy,
                    'amendment_policy' => $package->amendment_policy,
                    'payment_policy' => $package->payment_policy,
                    'remarks' => $package->remarks,
                    'thank_you_message' => $package->thank_you_message,
                    'inclusions' => $package->inclusions,
                    'exclusions' => $package->exclusions,
                    'duration' => $package->duration,
                    'price' => $package->price,
                    'website_cost' => $package->website_cost,
                    'show_on_website' => $package->show_on_website,
                    'image' => $package->image ? url('storage/' . $package->image) : null,
                    'day_events' => $package->day_events,
                    'days' => $package->days,
                    'options_data' => $package->options_data,
                    'created_by_name' => $package->creator ? $package->creator->name : 'Travbizz Travel IT Solutions',
                    'last_updated' => $package->updated_at ? $package->updated_at->format('d-m-Y') : null,
                    'updated_at' => $package->updated_at,
                    'created_at' => $package->created_at,
                    'lead_id' => $package->lead_id,
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
                    'start_date' => $package->start_date ? \Carbon\Carbon::parse($package->start_date)->format('Y-m-d') : null,
                    'end_date' => $package->end_date ? \Carbon\Carbon::parse($package->end_date)->format('Y-m-d') : null,
                    'adult' => $package->adult,
                    'child' => $package->child,
                    'infant' => $package->infant,
                    'destinations' => $package->destinations,
                    'routing' => $package->routing,
                    'notes' => $package->notes,
                    'terms_conditions' => $package->terms_conditions,
                    'refund_policy' => $package->refund_policy,
                    'package_description' => $package->package_description,
                    'confirmation_policy' => $package->confirmation_policy,
                    'amendment_policy' => $package->amendment_policy,
                    'payment_policy' => $package->payment_policy,
                    'remarks' => $package->remarks,
                    'thank_you_message' => $package->thank_you_message,
                    'inclusions' => $package->inclusions,
                    'exclusions' => $package->exclusions,
                    'duration' => $package->duration,
                    'price' => $package->price,
                    'website_cost' => $package->website_cost,
                    'show_on_website' => $package->show_on_website,
                    'image' => $package->image ? url('storage/' . $package->image) : null,
                    'day_events' => $package->day_events,
                    'days' => $package->days,
                    'options_data' => $package->options_data,
                    'created_by_name' => $package->creator ? $package->creator->name : 'Travbizz Travel IT Solutions',
                    'last_updated' => $package->updated_at ? $package->updated_at->format('d-m-Y') : null,
                    'updated_at' => $package->updated_at,
                    'created_at' => $package->created_at,
                    'lead_id' => $package->lead_id,
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
                'infant' => 'nullable|integer|min:0',
                'destinations' => 'nullable|string',
                'routing' => 'nullable|string',
                'notes' => 'nullable|string',
                'terms_conditions' => 'nullable',
                'refund_policy' => 'nullable',
                'package_description' => 'nullable',
                'confirmation_policy' => 'nullable',
                'amendment_policy' => 'nullable',
                'payment_policy' => 'nullable',
                'remarks' => 'nullable',
                'thank_you_message' => 'nullable',
                'price' => 'nullable|numeric|min:0',
                'website_cost' => 'nullable|numeric|min:0',
                'show_on_website' => 'nullable|boolean',
                'image' => 'nullable|mimes:jpeg,jpg,png,gif,bmp,webp,avif,svg|max:2048',
                'image_path' => 'nullable|string|max:500',
                'day_events' => 'nullable|array',
                'days' => 'nullable|array',
                'options_data' => 'nullable|array',
                'inclusions' => 'nullable',
                'exclusions' => 'nullable',
                'lead_id' => 'nullable|integer',
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

            // Audit Logging: Phase 3
            if ($request->has('lead_id') && !empty($request->lead_id)) {
                \App\Models\QueryHistoryLog::logActivity([
                    'lead_id' => $request->lead_id,
                    'activity_type' => 'itinerary_updated',
                    'activity_description' => "Itinerary content updated for '{$package->itinerary_name}'",
                    'module' => 'itinerary',
                    'record_id' => $package->id,
                    'metadata' => array_intersect_key($data, array_flip(['destinations', 'duration', 'itinerary_name']))
                ]);
            }
            
            
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
                    'start_date' => $package->start_date ? \Carbon\Carbon::parse($package->start_date)->format('Y-m-d') : null,
                    'end_date' => $package->end_date ? \Carbon\Carbon::parse($package->end_date)->format('Y-m-d') : null,
                    'adult' => $package->adult,
                    'child' => $package->child,
                    'infant' => $package->infant,
                    'destinations' => $package->destinations,
                    'routing' => $package->routing,
                    'notes' => $package->notes,
                    'terms_conditions' => $package->terms_conditions,
                    'refund_policy' => $package->refund_policy,
                    'package_description' => $package->package_description,
                    'confirmation_policy' => $package->confirmation_policy,
                    'amendment_policy' => $package->amendment_policy,
                    'payment_policy' => $package->payment_policy,
                    'remarks' => $package->remarks,
                    'thank_you_message' => $package->thank_you_message,
                    'inclusions' => $package->inclusions,
                    'exclusions' => $package->exclusions,
                    'duration' => $package->duration,
                    'price' => $package->price,
                    'website_cost' => $package->website_cost,
                    'show_on_website' => $package->show_on_website,
                    'image' => $package->image ? url('storage/' . $package->image) : null,
                    'day_events' => $package->day_events,
                    'days' => $package->days,
                    'options_data' => $package->options_data,
                    'created_by_name' => $package->creator ? $package->creator->name : 'Travbizz Travel IT Solutions',
                    'last_updated' => $package->updated_at ? $package->updated_at->format('d-m-Y') : null,
                    'updated_at' => $package->updated_at,
                    'created_at' => $package->created_at,
                    'lead_id' => $package->lead_id,
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

    /**
     * Duplicate an existing package.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function duplicate(Request $request, int $id): JsonResponse
    {
        try {
            $originalPackage = Package::find($id);

            if (!$originalPackage) {
                return response()->json([
                    'success' => false,
                    'message' => 'Original itinerary not found',
                ], 404);
            }

            // Replicate the main package model
            $newPackage = $originalPackage->replicate();
            
            // If lead_id is provided, link it to the lead
            if ($request->has('lead_id')) {
                $newPackage->lead_id = $request->lead_id;
                // Keep the same name if it's for a specific lead to avoid clutter
                $newPackage->itinerary_name = $originalPackage->itinerary_name;
            } else {
                // Append (Copy) to the name only if it's a general duplication
                $newPackage->itinerary_name = $originalPackage->itinerary_name . ' (Copy)';
            }
            
            $newPackage->created_by = auth()->id();
            $newPackage->save();

            // Also duplicate the pricing if it exists
            $originalPricing = \App\Models\ItineraryPricing::where('package_id', $originalPackage->id)->first();
            if ($originalPricing) {
                $newPricing = $originalPricing->replicate();
                $newPricing->package_id = $newPackage->id;
                // Sync lead_id to pricing as well if available
                if ($request->has('lead_id')) {
                    $newPricing->lead_id = $request->lead_id;
                }
                $newPricing->save();
            }

            return response()->json([
                'success' => true,
                'message' => 'Itinerary duplicated successfully',
                'data' => [
                    'id' => $newPackage->id,
                    'itinerary_name' => $newPackage->itinerary_name,
                    'lead_id' => $newPackage->lead_id
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while duplicating itinerary',
                'error' => config('app.debug') ? $e->getMessage() : $e->getMessage(),
            ], 500);
        }
    }
}

