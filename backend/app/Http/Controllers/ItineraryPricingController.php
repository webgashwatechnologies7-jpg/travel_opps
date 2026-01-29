<?php

namespace App\Http\Controllers;

use App\Models\ItineraryPricing;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ItineraryPricingController extends Controller
{
    /**
     * Get pricing configuration for a package (itinerary).
     */
    public function show(int $packageId): JsonResponse
    {
        try {
            $package = Package::find($packageId);

            if (!$package) {
                return response()->json([
                    'success' => false,
                    'message' => 'Package not found',
                ], 404);
            }

            $pricing = ItineraryPricing::where('package_id', $packageId)->first();

            if (!$pricing) {
                return response()->json([
                    'success' => true,
                    'message' => 'No pricing found for this package',
                    'data' => [
                        'package_id' => $packageId,
                        'pricing_data' => [],
                        'final_client_prices' => [],
                        'option_gst_settings' => [],
                        'base_markup' => 0,
                        'extra_markup' => 0,
                        'cgst' => 0,
                        'sgst' => 0,
                        'igst' => 0,
                        'tcs' => 0,
                        'discount' => 0,
                    ],
                ], 200);
            }

            return response()->json([
                'success' => true,
                'message' => 'Pricing retrieved successfully',
                'data' => $pricing,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving pricing',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create or update pricing configuration for a package.
     */
    public function upsert(Request $request, int $packageId): JsonResponse
    {
        try {
            $package = Package::find($packageId);

            if (!$package) {
                return response()->json([
                    'success' => false,
                    'message' => 'Package not found',
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'pricing_data' => 'nullable|array',
                'final_client_prices' => 'nullable|array',
                'option_gst_settings' => 'nullable|array',
                'base_markup' => 'nullable|numeric',
                'extra_markup' => 'nullable|numeric',
                'cgst' => 'nullable|numeric',
                'sgst' => 'nullable|numeric',
                'igst' => 'nullable|numeric',
                'tcs' => 'nullable|numeric',
                'discount' => 'nullable|numeric',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();

            $pricing = ItineraryPricing::updateOrCreate(
                ['package_id' => $packageId],
                array_merge(
                    [
                        'package_id' => $packageId,
                    ],
                    $data
                )
            );

            return response()->json([
                'success' => true,
                'message' => 'Pricing saved successfully',
                'data' => $pricing,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while saving pricing',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

