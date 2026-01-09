<?php

namespace App\Http\Controllers;

use App\Models\TransferPrice;
use App\Models\Transfer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class TransferPriceController extends Controller
{
    /**
     * Get all prices for a transfer.
     *
     * @param int $transferId
     * @return JsonResponse
     */
    public function index(int $transferId): JsonResponse
    {
        try {
            $transfer = Transfer::find($transferId);
            
            if (!$transfer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer not found',
                ], 404);
            }

            $prices = TransferPrice::where('transfer_id', $transferId)
                ->orderBy('from_date', 'desc')
                ->orderBy('to_date', 'desc')
                ->get()
                ->map(function ($price) {
                    return [
                        'id' => $price->id,
                        'transfer_id' => $price->transfer_id,
                        'from_date' => $price->from_date->format('Y-m-d'),
                        'to_date' => $price->to_date->format('Y-m-d'),
                        'price' => $price->price,
                        'created_at' => $price->created_at,
                        'updated_at' => $price->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Transfer prices retrieved successfully',
                'data' => $prices,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving transfer prices',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new transfer price.
     *
     * @param Request $request
     * @param int $transferId
     * @return JsonResponse
     */
    public function store(Request $request, int $transferId): JsonResponse
    {
        try {
            $transfer = Transfer::find($transferId);
            
            if (!$transfer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer not found',
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

            $price = TransferPrice::create([
                'transfer_id' => $transferId,
                'from_date' => $request->from_date,
                'to_date' => $request->to_date,
                'price' => $request->price,
            ]);

            // Update price_updates_count
            $transfer->increment('price_updates_count');

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transfer price created successfully',
                'data' => [
                    'id' => $price->id,
                    'transfer_id' => $price->transfer_id,
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
                'message' => 'An error occurred while creating transfer price',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a transfer price.
     *
     * @param Request $request
     * @param int $transferId
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $transferId, int $id): JsonResponse
    {
        try {
            $price = TransferPrice::where('transfer_id', $transferId)->find($id);

            if (!$price) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer price not found',
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
                'message' => 'Transfer price updated successfully',
                'data' => [
                    'id' => $price->id,
                    'transfer_id' => $price->transfer_id,
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
                'message' => 'An error occurred while updating transfer price',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a transfer price.
     *
     * @param int $transferId
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $transferId, int $id): JsonResponse
    {
        try {
            $price = TransferPrice::where('transfer_id', $transferId)->find($id);

            if (!$price) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer price not found',
                ], 404);
            }

            DB::beginTransaction();

            $price->delete();

            // Update price_updates_count
            $transfer = Transfer::find($transferId);
            if ($transfer && $transfer->price_updates_count > 0) {
                $transfer->decrement('price_updates_count');
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Transfer price deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting transfer price',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

