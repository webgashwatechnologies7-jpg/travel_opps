<?php

namespace App\Http\Controllers;

use App\Models\QueryProposal;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class QueryProposalController extends Controller
{
    /**
     * Get all proposals for a specific lead.
     */
    public function index(int $leadId): JsonResponse
    {
        try {
            $proposals = QueryProposal::where('lead_id', $leadId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Proposals retrieved successfully',
                'data' => $proposals,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving proposals',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create or update proposals for a lead.
     * This receives the full array of proposals from the frontend.
     */
    public function sync(Request $request, int $leadId): JsonResponse
    {
        try {
            $lead = Lead::find($leadId);
            if (!$lead) {
                return response()->json(['success' => false, 'message' => 'Lead not found'], 404);
            }

            $validator = Validator::make($request->all(), [
                'proposals' => 'required|array',
                'proposals.*.optionNumber' => 'required',
                'proposals.*.itinerary_id' => 'required|integer',
            ]);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'message' => 'Validation failed', 'errors' => $validator->errors()], 422);
            }

            $proposalsData = $request->input('proposals');
            
            // Start transaction for atomicity
            \Illuminate\Support\Facades\DB::beginTransaction();
            
            // Delete existing proposals for this lead to start fresh
            QueryProposal::where('lead_id', $leadId)->delete();

            foreach ($proposalsData as $item) {
                QueryProposal::create([
                    'lead_id' => $leadId,
                    'title' => $item['itinerary_name'] ?? 'Proposal',
                    'total_amount' => $item['price'] ?? 0,
                    'is_confirmed' => $item['confirmed'] ?? false,
                    'created_by' => $request->user()->id,
                    'metadata' => $item, 
                    'status' => ($item['confirmed'] ?? false) ? 'approved' : 'draft',
                ]);
            }
            
            \Illuminate\Support\Facades\DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proposals synced successfully',
                'data' => QueryProposal::where('lead_id', $leadId)->get(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while syncing proposals',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
