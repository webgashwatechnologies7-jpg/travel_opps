<?php

namespace App\Http\Controllers;

use App\Models\RoomType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class RoomTypeController extends Controller
{
    /**
     * Get all room types.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $roomTypes = RoomType::with('creator')
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($roomType) {
                    return [
                        'id' => $roomType->id,
                        'name' => $roomType->name,
                        'status' => $roomType->status,
                        'created_by' => $roomType->created_by,
                        'created_by_name' => $roomType->creator ? $roomType->creator->name : 'Travbizz Travel IT Solutions',
                        'last_update' => $roomType->updated_at ? $roomType->updated_at->format('d-m-Y') : null,
                        'updated_at' => $roomType->updated_at,
                        'created_at' => $roomType->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Room types retrieved successfully',
                'data' => $roomTypes,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving room types',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new room type.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'status' => 'nullable|in:active,inactive',
            ], [
                'name.required' => 'The name field is required.',
                'status.in' => 'The status must be either active or inactive.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $roomType = RoomType::create([
                'name' => $request->name,
                'status' => $request->status ?? 'active',
                'created_by' => $request->user()->id,
            ]);

            $roomType->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Room type created successfully',
                'data' => [
                    'id' => $roomType->id,
                    'name' => $roomType->name,
                    'status' => $roomType->status,
                    'created_by' => $roomType->created_by,
                    'created_by_name' => $roomType->creator ? $roomType->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $roomType->updated_at ? $roomType->updated_at->format('d-m-Y') : null,
                    'updated_at' => $roomType->updated_at,
                    'created_at' => $roomType->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating room type',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific room type.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $roomType = RoomType::with('creator')->find($id);

            if (!$roomType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Room type not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Room type retrieved successfully',
                'data' => [
                    'id' => $roomType->id,
                    'name' => $roomType->name,
                    'status' => $roomType->status,
                    'created_by' => $roomType->created_by,
                    'created_by_name' => $roomType->creator ? $roomType->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $roomType->updated_at ? $roomType->updated_at->format('d-m-Y') : null,
                    'updated_at' => $roomType->updated_at,
                    'created_at' => $roomType->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving room type',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a room type.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $roomType = RoomType::find($id);

            if (!$roomType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Room type not found',
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'status' => 'sometimes|in:active,inactive',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $updateData = [
                'name' => $request->has('name') ? $request->name : $roomType->name,
                'status' => $request->has('status') ? $request->status : $roomType->status,
            ];

            $roomType->update($updateData);
            $roomType->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Room type updated successfully',
                'data' => [
                    'id' => $roomType->id,
                    'name' => $roomType->name,
                    'status' => $roomType->status,
                    'created_by' => $roomType->created_by,
                    'created_by_name' => $roomType->creator ? $roomType->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $roomType->updated_at ? $roomType->updated_at->format('d-m-Y') : null,
                    'updated_at' => $roomType->updated_at,
                    'created_at' => $roomType->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating room type',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a room type.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $roomType = RoomType::find($id);

            if (!$roomType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Room type not found',
                ], 404);
            }

            $roomType->delete();

            return response()->json([
                'success' => true,
                'message' => 'Room type deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting room type',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

