<?php

namespace App\Http\Controllers;

use App\Models\HotelRate;
use App\Models\Hotel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class HotelRateController extends Controller
{
    /**
     * Get all rates for a hotel.
     *
     * @param int $hotelId
     * @return JsonResponse
     */
    public function index(int $hotelId): JsonResponse
    {
        try {
            $hotel = Hotel::find($hotelId);
            
            if (!$hotel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hotel not found',
                ], 404);
            }

            $rates = HotelRate::where('hotel_id', $hotelId)
                ->orderBy('from_date', 'desc')
                ->orderBy('to_date', 'desc')
                ->get()
                ->map(function ($rate) {
                    return [
                        'id' => $rate->id,
                        'hotel_id' => $rate->hotel_id,
                        'from_date' => $rate->from_date->format('Y-m-d'),
                        'to_date' => $rate->to_date->format('Y-m-d'),
                        'room_type' => $rate->room_type,
                        'meal_plan' => $rate->meal_plan,
                        'single' => $rate->single,
                        'double' => $rate->double,
                        'triple' => $rate->triple,
                        'quad' => $rate->quad,
                        'cwb' => $rate->cwb,
                        'cnb' => $rate->cnb,
                        'created_at' => $rate->created_at,
                        'updated_at' => $rate->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Hotel rates retrieved successfully',
                'data' => $rates,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving hotel rates',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new hotel rate.
     *
     * @param Request $request
     * @param int $hotelId
     * @return JsonResponse
     */
    public function store(Request $request, int $hotelId): JsonResponse
    {
        try {
            $hotel = Hotel::find($hotelId);
            
            if (!$hotel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hotel not found',
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'from_date' => 'required|date',
                'to_date' => 'required|date|after_or_equal:from_date',
                'room_type' => 'required|string|max:255',
                'meal_plan' => 'required|string|max:50',
                'single' => 'nullable|numeric|min:0',
                'double' => 'nullable|numeric|min:0',
                'triple' => 'nullable|numeric|min:0',
                'quad' => 'nullable|numeric|min:0',
                'cwb' => 'nullable|numeric|min:0',
                'cnb' => 'nullable|numeric|min:0',
            ], [
                'from_date.required' => 'The from date field is required.',
                'to_date.required' => 'The to date field is required.',
                'to_date.after_or_equal' => 'The to date must be after or equal to from date.',
                'room_type.required' => 'The room type field is required.',
                'meal_plan.required' => 'The meal plan field is required.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            DB::beginTransaction();

            $rate = HotelRate::create([
                'hotel_id' => $hotelId,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'room_type' => $request->room_type,
                'meal_plan' => $request->meal_plan,
                'single' => $request->single,
                'double' => $request->double,
                'triple' => $request->triple,
                'quad' => $request->quad,
                'cwb' => $request->cwb,
                'cnb' => $request->cnb,
            ]);

            // Update price_updates_count
            $hotel->increment('price_updates_count');

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Hotel rate created successfully',
                'data' => [
                    'id' => $rate->id,
                    'hotel_id' => $rate->hotel_id,
                    'from_date' => $rate->from_date->format('Y-m-d'),
                    'to_date' => $rate->to_date->format('Y-m-d'),
                    'room_type' => $rate->room_type,
                    'meal_plan' => $rate->meal_plan,
                    'single' => $rate->single,
                    'double' => $rate->double,
                    'triple' => $rate->triple,
                    'quad' => $rate->quad,
                    'cwb' => $rate->cwb,
                    'cnb' => $rate->cnb,
                    'created_at' => $rate->created_at,
                    'updated_at' => $rate->updated_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating hotel rate',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a hotel rate.
     *
     * @param Request $request
     * @param int $hotelId
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $hotelId, int $id): JsonResponse
    {
        try {
            $rate = HotelRate::where('hotel_id', $hotelId)->find($id);

            if (!$rate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hotel rate not found',
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'from_date' => 'sometimes|required|date',
                'to_date' => 'sometimes|required|date|after_or_equal:from_date',
                'room_type' => 'sometimes|required|string|max:255',
                'meal_plan' => 'sometimes|required|string|max:50',
                'single' => 'nullable|numeric|min:0',
                'double' => 'nullable|numeric|min:0',
                'triple' => 'nullable|numeric|min:0',
                'quad' => 'nullable|numeric|min:0',
                'cwb' => 'nullable|numeric|min:0',
                'cnb' => 'nullable|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $rate->update([
                'from_date' => $request->has('from_date') ? $request->from_date : $rate->from_date,
                'to_date' => $request->has('to_date') ? $request->to_date : $rate->to_date,
                'room_type' => $request->has('room_type') ? $request->room_type : $rate->room_type,
                'meal_plan' => $request->has('meal_plan') ? $request->meal_plan : $rate->meal_plan,
                'single' => $request->has('single') ? $request->single : $rate->single,
                'double' => $request->has('double') ? $request->double : $rate->double,
                'triple' => $request->has('triple') ? $request->triple : $rate->triple,
                'quad' => $request->has('quad') ? $request->quad : $rate->quad,
                'cwb' => $request->has('cwb') ? $request->cwb : $rate->cwb,
                'cnb' => $request->has('cnb') ? $request->cnb : $rate->cnb,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Hotel rate updated successfully',
                'data' => [
                    'id' => $rate->id,
                    'hotel_id' => $rate->hotel_id,
                    'from_date' => $rate->from_date->format('Y-m-d'),
                    'to_date' => $rate->to_date->format('Y-m-d'),
                    'room_type' => $rate->room_type,
                    'meal_plan' => $rate->meal_plan,
                    'single' => $rate->single,
                    'double' => $rate->double,
                    'triple' => $rate->triple,
                    'quad' => $rate->quad,
                    'cwb' => $rate->cwb,
                    'cnb' => $rate->cnb,
                    'created_at' => $rate->created_at,
                    'updated_at' => $rate->updated_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating hotel rate',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a hotel rate.
     *
     * @param int $hotelId
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $hotelId, int $id): JsonResponse
    {
        try {
            $rate = HotelRate::where('hotel_id', $hotelId)->find($id);

            if (!$rate) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hotel rate not found',
                ], 404);
            }

            DB::beginTransaction();

            $rate->delete();

            // Update price_updates_count
            $hotel = Hotel::find($hotelId);
            if ($hotel && $hotel->price_updates_count > 0) {
                $hotel->decrement('price_updates_count');
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Hotel rate deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting hotel rate',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
