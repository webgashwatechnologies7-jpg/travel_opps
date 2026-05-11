<?php

namespace App\Http\Controllers;

use App\Models\LeadProposal;
use App\Models\Package;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class LeadProposalController extends Controller
{
    /**
     * Get all proposals for a specific lead.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = LeadProposal::with('creator:id,name');

            if ($request->filled('lead_id')) {
                $query->where('lead_id', $request->lead_id);
            }

            $proposals = $query->orderBy('updated_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $proposals,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve proposals',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create a new proposal for a lead by cloning a template.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'package_id' => 'required|exists:packages,id',
                'lead_id' => 'required|exists:leads,id',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
            }

            $package = Package::find($request->package_id);
            
            // Check if this template was already cloned for this lead
            $existing = LeadProposal::withTrashed()
                ->where('lead_id', $request->lead_id)
                ->where('original_package_id', $request->package_id)
                ->first();

            if ($existing) {
                if ($existing->trashed()) {
                    $existing->restore();
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Using existing proposal',
                    'data' => $existing
                ], 200);
            }

            // Create new proposal from template
            $proposalData = $package->toArray();
            unset($proposalData['id'], $proposalData['created_at'], $proposalData['updated_at']);
            
            // NEW: Copy pricing from master pricing table if exists
            // This ensures library pricing (markups, final prices) is carried over to the clone
            $masterPricing = \App\Models\ItineraryPricing::where('package_id', $package->id)
                ->whereNull('lead_id')
                ->first();
            
            if ($masterPricing) {
                $proposalData['pricing_data'] = $masterPricing->pricing_data;
                $proposalData['final_client_prices'] = $masterPricing->final_client_prices;
                $proposalData['option_gst_settings'] = $masterPricing->option_gst_settings;
                $proposalData['base_markup'] = $masterPricing->base_markup;
                $proposalData['extra_markup'] = $masterPricing->extra_markup;
                $proposalData['cgst'] = $masterPricing->cgst;
                $proposalData['sgst'] = $masterPricing->sgst;
                $proposalData['igst'] = $masterPricing->igst;
                $proposalData['tcs'] = $masterPricing->tcs;
                $proposalData['discount'] = $masterPricing->discount;
            }
            
            $proposalData['lead_id'] = $request->lead_id;
            $proposalData['original_package_id'] = $request->package_id;
            $proposalData['created_by'] = auth()->id();

            $proposal = LeadProposal::create($proposalData);

            // Sync the price column for easier logging/sorting
            $displayPrice = $this->getDisplayPrice($proposal);
            $proposal->update(['price' => $displayPrice]);

            // Log activity
            \App\Models\QueryHistoryLog::logActivity([
                'lead_id' => $request->lead_id,
                'activity_type' => 'itinerary_added',
                'activity_description' => "Added itinerary '{$proposal->itinerary_name}' to lead",
                'module' => 'lead_proposal',
                'record_id' => $proposal->id,
                'new_values' => [
                    'itinerary_name' => $proposal->itinerary_name,
                    'price' => $displayPrice,
                    'routing' => $proposal->routing,
                    'destinations' => $proposal->destinations
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Proposal created successfully',
                'data' => $proposal
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create proposal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get a single proposal.
     */
    public function show(int $id): JsonResponse
    {
        $proposal = LeadProposal::with('originalPackage')->find($id);
        if (!$proposal) {
            return response()->json(['success' => false, 'message' => 'Proposal not found'], 404);
        }

        return response()->json(['success' => true, 'data' => $proposal], 200);
    }

    /**
     * Update a proposal.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $proposal = LeadProposal::find($id);
            if (!$proposal) {
                return response()->json(['success' => false, 'message' => 'Proposal not found'], 404);
            }

            $oldDisplayPrice = $this->getDisplayPrice($proposal);
            $oldValues = [
                'itinerary_name' => $proposal->itinerary_name,
                'price' => $oldDisplayPrice
            ];

            $data = $request->all();
            
            // Handle image upload if provided
            if ($request->hasFile('image')) {
                // Delete old image if exists
                if ($proposal->image) {
                    Storage::disk('public')->delete($proposal->image);
                }
                $data['image'] = $request->file('image')->store('proposals', 'public');
            }

            $proposal->update($data);

            // Sync the price column from final_client_prices if updated
            $newDisplayPrice = $this->getDisplayPrice($proposal);
            if ($newDisplayPrice != $proposal->price) {
                $proposal->update(['price' => $newDisplayPrice]);
            }

            // Log activity
            if ($proposal->itinerary_name !== $oldValues['itinerary_name'] || $newDisplayPrice != $oldValues['price']) {
                \App\Models\QueryHistoryLog::logActivity([
                    'lead_id' => $proposal->lead_id,
                    'activity_type' => 'itinerary_updated',
                    'activity_description' => "Updated itinerary '{$proposal->itinerary_name}'",
                    'module' => 'lead_proposal',
                    'record_id' => $proposal->id,
                    'old_values' => $oldValues,
                    'new_values' => [
                        'itinerary_name' => $proposal->itinerary_name,
                        'price' => $newDisplayPrice,
                        'routing' => $proposal->routing,
                        'destinations' => $proposal->destinations
                    ]
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Proposal updated successfully',
                'data' => $proposal
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update proposal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Confirm one proposal and delete others for the same lead. (Auto-Cleanup)
     */
    public function confirm(int $id): JsonResponse
    {
        try {
            $proposal = LeadProposal::find($id);
            if (!$proposal) {
                return response()->json(['success' => false, 'message' => 'Proposal not found'], 404);
            }

            $leadId = $proposal->lead_id;

            // Log activity for confirmation
            \App\Models\QueryHistoryLog::logActivity([
                'lead_id' => $leadId,
                'activity_type' => 'itinerary_confirmed',
                'activity_description' => "Confirmed itinerary '{$proposal->itinerary_name}' and cleaned up drafts",
                'module' => 'lead_proposal',
                'record_id' => $proposal->id,
                'metadata' => [
                    'price' => $proposal->price,
                    'routing' => $proposal->routing,
                    'destinations' => $proposal->destinations
                ]
            ]);

            // Delete all other proposals for this lead and log them to history
            $otherProposals = LeadProposal::where('lead_id', $leadId)
                ->where('id', '!=', $id)
                ->get();

            foreach ($otherProposals as $other) {
                // Log activity before deletion so it shows in History
                \App\Models\QueryHistoryLog::logActivity([
                    'lead_id' => $leadId,
                    'activity_type' => 'itinerary_removed',
                    'activity_description' => "Archived draft itinerary '{$other->itinerary_name}' during confirmation",
                    'module' => 'lead_proposal',
                    'record_id' => $other->id,
                    'old_values' => [
                        'itinerary_name' => $other->itinerary_name,
                        'price' => $other->price,
                        'routing' => $other->routing,
                        'destinations' => $other->destinations
                    ]
                ]);
                $other->delete();
            }

            $proposal->update(['is_confirmed' => true]);

            return response()->json([
                'success' => true,
                'message' => 'Proposal confirmed. Other drafts have been cleaned up.',
                'data' => $proposal
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm proposal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a proposal.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $proposal = LeadProposal::find($id);
            if (!$proposal) {
                return response()->json(['success' => false, 'message' => 'Proposal not found'], 404);
            }

            $displayPrice = $this->getDisplayPrice($proposal);
            // Log activity before deletion so we have a record of what was removed
            \App\Models\QueryHistoryLog::logActivity([
                'lead_id' => $proposal->lead_id,
                'activity_type' => 'itinerary_removed',
                'activity_description' => "Removed itinerary '{$proposal->itinerary_name}'",
                'module' => 'lead_proposal',
                'record_id' => $proposal->id,
                'old_values' => [
                    'itinerary_name' => $proposal->itinerary_name,
                    'price' => $displayPrice,
                    'routing' => $proposal->routing,
                    'destinations' => $proposal->destinations
                ]
            ]);

            $proposal->delete();

            return response()->json(['success' => true, 'message' => 'Proposal deleted successfully'], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete proposal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get history of itinerary changes for a lead.
     */
    public function history(Request $request, int $leadId): JsonResponse
    {
        try {
            $history = \App\Models\QueryHistoryLog::where('lead_id', $leadId)
                ->whereIn('activity_type', ['itinerary_removed', 'itinerary_confirmed'])
                ->with('user:id,name')
                ->orderBy('created_at', 'desc')
                ->get();

            // Format history for the frontend (ItineraryHistoryTab.jsx expects version structure)
            $formatted = $history->map(function($log, $index) use ($history) {
                // For removals, the "Old" data is the snapshot of the plan before it was deleted
                $proposalData = $log->old_values ?? $log->new_values ?? [];
                
                return [
                    'id' => $log->id,
                    'version_number' => $history->count() - $index,
                    'archived_at' => $log->created_at,
                    'activity_type' => $log->activity_type,
                    'activity_description' => $log->activity_description,
                    'itinerary_name' => $proposalData['itinerary_name'] ?? 'Itinerary',
                    'price' => $proposalData['price'] ?? null,
                    'routing' => $proposalData['routing'] ?? null,
                    'destination' => $proposalData['destinations'] ?? $proposalData['destination'] ?? null,
                    'archived_by_name' => $log->user?->name ?? 'System',
                    'options' => [
                        array_merge($proposalData, [
                            'metadata' => $proposalData,
                            'price' => $proposalData['price'] ?? 0,
                            'itinerary_name' => $proposalData['itinerary_name'] ?? 'Itinerary',
                            'routing' => $proposalData['routing'] ?? null,
                            'destination' => $proposalData['destinations'] ?? $proposalData['destination'] ?? null
                        ])
                    ]
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $formatted,
                'total_changes' => $formatted->count()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve history',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Helper to get the most representative price for a proposal.
     */
    private function getDisplayPrice($proposal)
    {
        // 1. Try final_client_prices first (highest priority - final per-option total)
        if ($proposal->final_client_prices && is_array($proposal->final_client_prices)) {
            // Filter out non-numeric values
            $prices = array_filter($proposal->final_client_prices, function($v) {
                return is_numeric($v) && (float)$v > 0;
            });
            if (!empty($prices)) {
                return (float) max($prices);
            }
        }

        // 2. Try pricing_data (calculated totals from hotel/transfer items)
        if ($proposal->pricing_data && is_array($proposal->pricing_data)) {
            $totalGross = 0;
            foreach ($proposal->pricing_data as $opt) {
                // If it's a nested structure (key-based), opt might be the data itself
                $price = $opt['total_price'] ?? $opt['price'] ?? $opt['gross'] ?? $opt['total'] ?? 0;
                if (is_numeric($price)) {
                    $totalGross = max($totalGross, (float)$price);
                }
            }
            if ($totalGross > 0) {
                return $totalGross;
            }
        }

        // 3. Fallback to basic price column (usually from the Package table)
        return (float) ($proposal->price ?? 0);
    }
}
