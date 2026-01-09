<?php

namespace App\Http\Controllers;

use App\Models\ActivityPrice;
use App\Models\Activity;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class ActivityPriceController extends Controller
{
    /**
     * Get all prices for an activity.
     *
     * @param int $activityId
     * @return JsonResponse
     */
    public function index(int $activityId): JsonResponse
    {
        try {
            $activity = Activity::find($activityId);
            
            if (!$activity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found',
                ], 404);
            }

            $prices = ActivityPrice::where('activity_id', $activityId)
                ->orderBy('from_date', 'desc')
                ->orderBy('to_date', 'desc')
                ->get()
                ->map(function ($price) {
                    return [
                        'id' => $price->id,
                        'activity_id' => $price->activity_id,
                        'from_date' => $price->from_date->format('Y-m-d'),
                        'to_date' => $price->to_date->format('Y-m-d'),
                        'price' => $price->price,
                        'created_at' => $price->created_at,
                        'updated_at' => $price->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Activity prices retrieved successfully',
                'data' => $prices,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving activity prices',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new activity price.
     *
     * @param Request $request
     * @param int $activityId
     * @return JsonResponse
     */
    public function store(Request $request, int $activityId): JsonResponse
    {
        try {
            $activity = Activity::find($activityId);
            
            if (!$activity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found',
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'from_date' => 'required|date',
                'to_date' => 'required|date|after_or_equal:from_date',
                'price' => 'required|numeric|min:0',
            ], [
                'from_date.required' => 'The from date field is required.',
                'to_date.required' => 'The to date field is required.',
                'to_date.after_or_equal' => 'The to date must be after or equal to from date.',
                'price.required' => 'The price field is required.',
                'price.numeric' => 'The price must be a number.',
                'price.min' => 'The price must be at least 0.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            DB::beginTransaction();

            $price = ActivityPrice::create([
                'activity_id' => $activityId,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'price' => $request->price,
            ]);

            // Update price_updates_count
            $activity->increment('price_updates_count');

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Activity price created successfully',
                'data' => [
                    'id' => $price->id,
                    'activity_id' => $price->activity_id,
                    'from_date' => $price->from_date->format('Y-m-d'),
                    'to_date' => $price->to_date->format('Y-m-d'),
                    'price' => $price->price,
                    'created_at' => $price->created_at,
                    'updated_at' => $price->updated_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating activity price',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update an activity price.
     *
     * @param Request $request
     * @param int $activityId
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $activityId, int $id): JsonResponse
    {
        try {
            $price = ActivityPrice::where('activity_id', $activityId)->find($id);

            if (!$price) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity price not found',
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'from_date' => 'sometimes|required|date',
                'to_date' => 'sometimes|required|date|after_or_equal:from_date',
                'price' => 'sometimes|required|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $price->update([
                'from_date' => $request->has('from_date') ? $request->from_date : $price->from_date,
                'to_date' => $request->has('to_date') ? $request->to_date : $price->to_date,
                'price' => $request->has('price') ? $request->price : $price->price,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Activity price updated successfully',
                'data' => [
                    'id' => $price->id,
                    'activity_id' => $price->activity_id,
                    'from_date' => $price->from_date->format('Y-m-d'),
                    'to_date' => $price->to_date->format('Y-m-d'),
                    'price' => $price->price,
                    'created_at' => $price->created_at,
                    'updated_at' => $price->updated_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating activity price',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete an activity price.
     *
     * @param int $activityId
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $activityId, int $id): JsonResponse
    {
        try {
            $price = ActivityPrice::where('activity_id', $activityId)->find($id);

            if (!$price) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity price not found',
                ], 404);
            }

            DB::beginTransaction();

            $price->delete();

            // Update price_updates_count
            $activity = Activity::find($activityId);
            if ($activity && $activity->price_updates_count > 0) {
                $activity->decrement('price_updates_count');
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Activity price deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting activity price',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

