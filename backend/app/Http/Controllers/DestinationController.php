<?php

namespace App\Http\Controllers;

use App\Models\Destination;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DestinationController extends Controller
{
    /**
     * Get all destinations.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $destinations = Destination::orderBy('name', 'asc')
                ->get()
                ->map(function ($destination) {
                    return [
                        'id' => $destination->id,
                        'name' => $destination->name,
                        'created_at' => $destination->created_at,
                        'updated_at' => $destination->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Destinations retrieved successfully',
                'data' => $destinations,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving destinations',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new destination.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255|unique:destinations,name',
            ], [
                'name.required' => 'The name field is required.',
                'name.unique' => 'A destination with this name already exists.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $destination = Destination::create([
                'name' => $request->name,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Destination created successfully',
                'data' => [
                    'id' => $destination->id,
                    'name' => $destination->name,
                    'created_at' => $destination->created_at,
                    'updated_at' => $destination->updated_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating destination',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific destination.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $destination = Destination::find($id);

            if (!$destination) {
                return response()->json([
                    'success' => false,
                    'message' => 'Destination not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Destination retrieved successfully',
                'data' => [
                    'id' => $destination->id,
                    'name' => $destination->name,
                    'created_at' => $destination->created_at,
                    'updated_at' => $destination->updated_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving destination',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a destination.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $destination = Destination::find($id);

            if (!$destination) {
                return response()->json([
                    'success' => false,
                    'message' => 'Destination not found',
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255|unique:destinations,name,' . $id,
            ], [
                'name.required' => 'The name field is required.',
                'name.unique' => 'A destination with this name already exists.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $destination->update([
                'name' => $request->has('name') ? $request->name : $destination->name,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Destination updated successfully',
                'data' => [
                    'id' => $destination->id,
                    'name' => $destination->name,
                    'created_at' => $destination->created_at,
                    'updated_at' => $destination->updated_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating destination',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a destination.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $destination = Destination::find($id);

            if (!$destination) {
                return response()->json([
                    'success' => false,
                    'message' => 'Destination not found',
                ], 404);
            }

            $destination->delete();

            return response()->json([
                'success' => true,
                'message' => 'Destination deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting destination',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

