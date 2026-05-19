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
    public function show(Request $request, int $packageId): JsonResponse
    {
        try {
            $package = Package::find($packageId);
            $proposal = null;

            if (!$package) {
                $proposal = \App\Models\LeadProposal::find($packageId);
                if (!$proposal) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Package or Proposal not found',
                    ], 404);
                }
            }

            if ($proposal) {
                $pricing = [
                    'id' => $proposal->id,
                    'package_id' => $proposal->id,
                    'lead_id' => $proposal->lead_id,
                    'pricing_data' => $proposal->pricing_data ?? [],
                    'final_client_prices' => $proposal->final_client_prices ?? [],
                    'option_gst_settings' => $proposal->option_gst_settings ?? [],
                    'base_markup' => $proposal->base_markup ?? 0,
                    'extra_markup' => $proposal->extra_markup ?? 0,
                    'cgst' => $proposal->cgst ?? 0,
                    'sgst' => $proposal->sgst ?? 0,
                    'igst' => $proposal->igst ?? 0,
                    'tcs' => $proposal->tcs ?? 0,
                    'discount' => $proposal->discount ?? 0,
                ];

                return response()->json([
                    'success' => true,
                    'message' => 'Pricing retrieved successfully from proposal',
                    'data' => $pricing,
                ], 200);
            }

            $leadId = $request->query('lead_id');
            $pricing = null;

            if ($leadId) {
                $pricing = ItineraryPricing::where('package_id', $packageId)
                    ->where('lead_id', $leadId)
                    ->first();
            }

            if (!$pricing) {
                $pricing = ItineraryPricing::where('package_id', $packageId)
                    ->whereNull('lead_id')
                    ->first();
            }

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
            $proposal = null;

            if (!$package) {
                $proposal = \App\Models\LeadProposal::find($packageId);
                if (!$proposal) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Package or Proposal not found',
                    ], 404);
                }
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

            if ($proposal) {
                $proposal->update([
                    'pricing_data' => $data['pricing_data'] ?? null,
                    'final_client_prices' => $data['final_client_prices'] ?? null,
                    'option_gst_settings' => $data['option_gst_settings'] ?? null,
                    'base_markup' => $data['base_markup'] ?? null,
                    'extra_markup' => $data['extra_markup'] ?? null,
                    'cgst' => $data['cgst'] ?? null,
                    'sgst' => $data['sgst'] ?? null,
                    'igst' => $data['igst'] ?? null,
                    'tcs' => $data['tcs'] ?? null,
                    'discount' => $data['discount'] ?? null,
                ]);

                // Audit Logging
                if ($proposal->lead_id) {
                    \App\Models\QueryHistoryLog::logActivity([
                        'lead_id' => $proposal->lead_id,
                        'activity_type' => 'itinerary_pricing_updated',
                        'activity_description' => "Itinerary pricing updated for proposal #{$packageId}",
                        'module' => 'itinerary_pricing',
                        'record_id' => $proposal->id,
                        'metadata' => [
                            'base_markup' => $data['base_markup'] ?? null,
                            'extra_markup' => $data['extra_markup'] ?? null,
                            'package_id' => $packageId
                        ]
                    ]);
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Pricing saved successfully to proposal',
                    'data' => [
                        'id' => $proposal->id,
                        'package_id' => $proposal->id,
                        'lead_id' => $proposal->lead_id,
                        'pricing_data' => $proposal->pricing_data,
                        'final_client_prices' => $proposal->final_client_prices,
                        'option_gst_settings' => $proposal->option_gst_settings,
                        'base_markup' => $proposal->base_markup,
                        'extra_markup' => $proposal->extra_markup,
                        'cgst' => $proposal->cgst,
                        'sgst' => $proposal->sgst,
                        'igst' => $proposal->igst,
                        'tcs' => $proposal->tcs,
                        'discount' => $proposal->discount,
                    ],
                ], 200);
            }

            $leadId = $request->input('lead_id');

            $pricing = ItineraryPricing::updateOrCreate(
                ['package_id' => $packageId, 'lead_id' => $leadId],
                array_merge(
                    [
                        'package_id' => $packageId,
                        'lead_id' => $leadId,
                    ],
                    $data
                )
            );

            // Audit Logging: Phase 3
            if ($request->has('lead_id') && !empty($request->lead_id)) {
                $leadId = $request->input('lead_id');
                \App\Models\QueryHistoryLog::logActivity([
                    'lead_id' => $leadId,
                    'activity_type' => 'itinerary_pricing_updated',
                    'activity_description' => "Itinerary pricing updated for package #{$packageId}",
                    'module' => 'itinerary_pricing',
                    'record_id' => $pricing->id,
                    'metadata' => [
                        'base_markup' => $data['base_markup'] ?? null,
                        'extra_markup' => $data['extra_markup'] ?? null,
                        'package_id' => $packageId
                    ]
                ]);
            }

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

