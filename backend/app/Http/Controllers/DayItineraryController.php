<?php

namespace App\Http\Controllers;

use App\Models\DayItinerary;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class DayItineraryController extends Controller
{
    /**
     * Get all day itineraries.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $dayItineraries = DayItinerary::with('creator')
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($itinerary) {
                    return [
                        'id' => $itinerary->id,
                        'destination' => $itinerary->destination,
                        'title' => $itinerary->title,
                        'details' => $itinerary->details,
                        'detail' => $itinerary->details, // Alias for compatibility
                        'status' => $itinerary->status,
                        'image' => $itinerary->image ? url('storage/' . $itinerary->image) : null,
                        'created_by' => $itinerary->created_by,
                        'created_by_name' => $itinerary->creator ? $itinerary->creator->name : 'Travbizz Travel IT Solutions',
                        'last_update' => $itinerary->updated_at ? $itinerary->updated_at->format('d-m-Y') : null,
                        'updated_at' => $itinerary->updated_at,
                        'created_at' => $itinerary->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Day itineraries retrieved successfully',
                'data' => $dayItineraries,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving day itineraries',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new day itinerary.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Handle file upload
            $imagePath = null;
            if ($request->hasFile('image')) {
                $file = $request->file('image');
                $imagePath = $file->store('day-itineraries', 'public');
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'destination' => 'nullable|string|max:255',
                'title' => 'required|string|max:255',
                'details' => 'nullable|string',
                'status' => 'nullable|in:active,inactive',
                'image' => 'nullable|mimes:jpeg,png,jpg,gif,svg,webp,avif|max:2048',
            ], [
                'title.required' => 'The title field is required.',
                'status.in' => 'The status must be either active or inactive.',
                'image.mimes' => 'The image must be a valid image file (jpeg, jpg, png, gif, svg, webp, avif).',
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

            $dayItinerary = DayItinerary::create([
                'destination' => $request->destination,
                'title' => $request->title,
                'details' => $request->details,
                'status' => $request->status ?? 'active',
                'image' => $imagePath,
                'created_by' => $request->user()->id,
            ]);

            $dayItinerary->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Day itinerary created successfully',
                'data' => [
                    'id' => $dayItinerary->id,
                    'destination' => $dayItinerary->destination,
                    'title' => $dayItinerary->title,
                    'details' => $dayItinerary->details,
                    'detail' => $dayItinerary->details,
                    'status' => $dayItinerary->status,
                    'image' => $dayItinerary->image ? url('storage/' . $dayItinerary->image) : null,
                    'created_by' => $dayItinerary->created_by,
                    'created_by_name' => $dayItinerary->creator ? $dayItinerary->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $dayItinerary->updated_at ? $dayItinerary->updated_at->format('d-m-Y') : null,
                    'updated_at' => $dayItinerary->updated_at,
                    'created_at' => $dayItinerary->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            // Delete uploaded file if creation fails
            if (isset($imagePath) && $imagePath && Storage::disk('public')->exists($imagePath)) {
                Storage::disk('public')->delete($imagePath);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating day itinerary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific day itinerary.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $dayItinerary = DayItinerary::with('creator')->find($id);

            if (!$dayItinerary) {
                return response()->json([
                    'success' => false,
                    'message' => 'Day itinerary not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Day itinerary retrieved successfully',
                'data' => [
                    'id' => $dayItinerary->id,
                    'destination' => $dayItinerary->destination,
                    'title' => $dayItinerary->title,
                    'details' => $dayItinerary->details,
                    'detail' => $dayItinerary->details,
                    'status' => $dayItinerary->status,
                    'image' => $dayItinerary->image ? url('storage/' . $dayItinerary->image) : null,
                    'created_by' => $dayItinerary->created_by,
                    'created_by_name' => $dayItinerary->creator ? $dayItinerary->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $dayItinerary->updated_at ? $dayItinerary->updated_at->format('d-m-Y') : null,
                    'updated_at' => $dayItinerary->updated_at,
                    'created_at' => $dayItinerary->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving day itinerary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a day itinerary.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $dayItinerary = DayItinerary::find($id);

            if (!$dayItinerary) {
                return response()->json([
                    'success' => false,
                    'message' => 'Day itinerary not found',
                ], 404);
            }

            // Handle file upload
            $imagePath = $dayItinerary->image;
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($dayItinerary->image && Storage::disk('public')->exists($dayItinerary->image)) {
                    Storage::disk('public')->delete($dayItinerary->image);
                }
                $file = $request->file('image');
                $imagePath = $file->store('day-itineraries', 'public');
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'destination' => 'sometimes|nullable|string|max:255',
                'title' => 'sometimes|required|string|max:255',
                'details' => 'nullable|string',
                'status' => 'sometimes|in:active,inactive',
                'image' => 'nullable|mimes:jpeg,png,jpg,gif,svg,webp,avif|max:2048',
            ], [
                'image.mimes' => 'The image must be a valid image file (jpeg, jpg, png, gif, svg, webp, avif).',
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

            $updateData = [
                'destination' => $request->has('destination') ? $request->destination : $dayItinerary->destination,
                'title' => $request->has('title') ? $request->title : $dayItinerary->title,
                'details' => $request->has('details') ? $request->details : $dayItinerary->details,
                'status' => $request->has('status') ? $request->status : $dayItinerary->status,
                'image' => $imagePath,
            ];

            $dayItinerary->update($updateData);
            $dayItinerary->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Day itinerary updated successfully',
                'data' => [
                    'id' => $dayItinerary->id,
                    'destination' => $dayItinerary->destination,
                    'title' => $dayItinerary->title,
                    'details' => $dayItinerary->details,
                    'detail' => $dayItinerary->details,
                    'status' => $dayItinerary->status,
                    'image' => $dayItinerary->image ? url('storage/' . $dayItinerary->image) : null,
                    'created_by' => $dayItinerary->created_by,
                    'created_by_name' => $dayItinerary->creator ? $dayItinerary->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $dayItinerary->updated_at ? $dayItinerary->updated_at->format('d-m-Y') : null,
                    'updated_at' => $dayItinerary->updated_at,
                    'created_at' => $dayItinerary->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating day itinerary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a day itinerary.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $dayItinerary = DayItinerary::find($id);

            if (!$dayItinerary) {
                return response()->json([
                    'success' => false,
                    'message' => 'Day itinerary not found',
                ], 404);
            }

            $dayItinerary->delete();

            return response()->json([
                'success' => true,
                'message' => 'Day itinerary deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting day itinerary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

