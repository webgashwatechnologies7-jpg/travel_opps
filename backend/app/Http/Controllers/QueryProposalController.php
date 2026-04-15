<?php

namespace App\Http\Controllers;

use App\Models\QueryProposal;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class QueryProposalController extends Controller
{
    /**
     * Get ACTIVE proposals for a specific lead.
     * (Only the currently selected itinerary's options)
     */
    public function index(int $leadId): JsonResponse
    {
        try {
            $proposals = QueryProposal::where('lead_id', $leadId)
                ->where('version_status', 'active')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Proposals retrieved successfully',
                'data'    => $proposals,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving proposals',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get ARCHIVED proposals for a specific lead (Itinerary Change History).
     * Groups by version_number so each "change event" is one history entry.
     */
    public function history(int $leadId): JsonResponse
    {
        try {
            // Get archived records grouped by version_number
            $archived = QueryProposal::where('lead_id', $leadId)
                ->where('version_status', 'archived')
                ->orderBy('version_number', 'desc')
                ->orderBy('archived_at', 'desc')
                ->get();

            // Group by version_number for clean display
            $grouped = [];
            foreach ($archived as $proposal) {
                $vNum = $proposal->version_number;
                if (!isset($grouped[$vNum])) {
                    $grouped[$vNum] = [
                        'version_number'  => $vNum,
                        'archived_at'     => $proposal->archived_at,
                        'itinerary_name'  => $proposal->metadata['itinerary_name']
                            ?? $proposal->title
                            ?? 'Itinerary',
                        'itinerary_id'    => $proposal->metadata['itinerary_id'] ?? null,
                        'destination'     => $proposal->metadata['destination'] ?? null,
                        'duration'        => $proposal->metadata['duration'] ?? null,
                        'image'           => $proposal->metadata['image'] ?? null,
                        'options'         => [],
                        'archived_by_name' => null,
                    ];
                }
                $grouped[$vNum]['options'][] = $proposal;

                // Get archiver name (first record has it)
                if (!$grouped[$vNum]['archived_by_name'] && $proposal->archived_by) {
                    $archiver = \App\Models\User::find($proposal->archived_by);
                    $grouped[$vNum]['archived_by_name'] = $archiver?->name ?? 'Unknown';
                }
            }

            // Sort by version descending (newest archived first)
            krsort($grouped);

            return response()->json([
                'success' => true,
                'message' => 'Itinerary history retrieved successfully',
                'data'    => array_values($grouped),
                'total_changes' => count($grouped),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving history',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Sync / Save new proposals for a lead.
     * Instead of hard-deleting old proposals, we ARCHIVE them first.
     * This preserves the complete itinerary change history.
     */
    public function sync(Request $request, int $leadId): JsonResponse
    {
        try {
            $lead = Lead::find($leadId);
            if (!$lead) {
                return response()->json(['success' => false, 'message' => 'Lead not found'], 404);
            }

            $validator = Validator::make($request->all(), [
                'proposals'               => 'present|array',
                'proposals.*.itinerary_id' => 'required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors'  => $validator->errors(),
                ], 422);
            }

            $proposalsData = $request->input('proposals');

            DB::beginTransaction();

            // ── Step 1: Find the current ACTIVE proposals ──────────────────────
            $currentActive = QueryProposal::where('lead_id', $leadId)
                ->where('version_status', 'active')
                ->get();

            // ── Step 2: Determine the next version number ─────────────────────
            $latestVersion = QueryProposal::where('lead_id', $leadId)->max('version_number') ?? 0;
            $nextVersion   = $latestVersion + 1;

            // ── Step 3: If there are existing active proposals AND new proposals
            //            are being added, archive the old ones first ────────────
            if ($currentActive->count() > 0 && count($proposalsData) > 0) {
                // Check if itinerary actually changed  (compare itinerary_id)
                $oldItineraryId = $currentActive->first()->metadata['itinerary_id'] ?? null;
                $newItineraryId = $proposalsData[0]['itinerary_id'] ?? null;

                if ($oldItineraryId !== $newItineraryId || $oldItineraryId === null) {
                    // Different itinerary → archive the old active proposals
                    QueryProposal::where('lead_id', $leadId)
                        ->where('version_status', 'active')
                        ->update([
                            'version_status' => 'archived',
                            'archived_at'    => now(),
                            'archived_by'    => $request->user()->id,
                        ]);
                } else {
                    // Same itinerary, just updating prices/options → DELETE old active (no history needed)
                    QueryProposal::where('lead_id', $leadId)
                        ->where('version_status', 'active')
                        ->delete();
                    $nextVersion = $latestVersion; // keep version number same
                }
            } elseif ($currentActive->count() > 0 && count($proposalsData) === 0) {
                // "Remove All" clicked → archive everything
                QueryProposal::where('lead_id', $leadId)
                    ->where('version_status', 'active')
                    ->update([
                        'version_status' => 'archived',
                        'archived_at'    => now(),
                        'archived_by'    => $request->user()->id,
                    ]);
            }

            // ── Step 4: Insert new active proposals ───────────────────────────
            $hasNewlyConfirmed = false;
            foreach ($proposalsData as $item) {
                $confirmed = $item['confirmed'] ?? false;
                if ($confirmed) $hasNewlyConfirmed = true;

                QueryProposal::create([
                    'lead_id'        => $leadId,
                    'title'          => $item['itinerary_name'] ?? 'Proposal',
                    'total_amount'   => $item['price'] ?? 0,
                    'is_confirmed'   => $confirmed,
                    'created_by'     => $request->user()->id,
                    'metadata'       => $item,
                    'status'         => $confirmed ? 'approved' : 'draft',
                    'company_id'     => $lead->company_id,
                    'version_status' => 'active',
                    'version_number' => $nextVersion,
                ]);
            }

            // ── Step 5: Log activity ──────────────────────────────────────────
            \App\Models\QueryHistoryLog::logActivity([
                'lead_id'              => $leadId,
                'activity_type'        => 'proposal_synced',
                'activity_description' => "Itinerary proposals synced (Count: " . count($proposalsData) . ", Version: {$nextVersion})",
                'module'               => 'proposals',
                'metadata'             => [
                    'count'         => count($proposalsData),
                    'version'       => $nextVersion,
                    'has_confirmed' => $hasNewlyConfirmed,
                    'itinerary_name' => $proposalsData[0]['itinerary_name'] ?? null,
                ],
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proposals synced successfully',
                'data'    => QueryProposal::where('lead_id', $leadId)
                    ->where('version_status', 'active')
                    ->get(),
            ], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while syncing proposals',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
