<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Leads\Domain\Entities\LeadFollowup;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\User;

class FollowUpController extends Controller
{
    /**
     * Get follow-ups for a specific client
     */
    public function getClientFollowUps($clientId): JsonResponse
    {
        try {
            $followUps = LeadFollowup::where('lead_id', $clientId)
                ->with(['creator']) // Load user who created the follow-up
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($followUp) {
                    return [
                        'id' => $followUp->id,
                        'date' => $followUp->followup_date ? $followUp->followup_date->format('Y-m-d') : $followUp->created_at->format('Y-m-d'),
                        'time' => $followUp->followup_date ? $followUp->followup_date->format('H:i') : $followUp->created_at->format('H:i'),
                        'type' => $followUp->followup_type,
                        'notes' => $followUp->remark,
                        'nextAction' => $followUp->next_action,
                        'nextFollowUpDate' => $followUp->next_followup_date ? $followUp->next_followup_date->format('Y-m-d') : null,
                        'createdBy' => $followUp->creator ? $followUp->creator->name : 'Unknown',
                        'createdAt' => $followUp->created_at->format('Y-m-d H:i:s')
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Follow-ups retrieved successfully',
                'data' => $followUps
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve follow-ups: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new follow-up
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'client_id' => 'required|exists:leads,id',
                'type' => 'required|string|max:255',
                'date' => 'required|date',
                'time' => 'nullable|string',
                'notes' => 'required|string',
                'next_action' => 'nullable|string|max:500',
                'next_followup_date' => 'nullable|date|after_or_equal:date'
            ], [
                'client_id.required' => 'Client ID is required',
                'type.required' => 'Follow-up type is required',
                'date.required' => 'Follow-up date is required',
                'notes.required' => 'Follow-up notes are required'
            ]);

            // Create follow-up
            $followUp = LeadFollowup::create([
                'lead_id' => $validated['client_id'],
                'followup_type' => $validated['type'],
                'followup_date' => $validated['date'] . ' ' . ($validated['time'] ?? '00:00'),
                'remark' => $validated['notes'],
                'next_action' => $validated['next_action'],
                'next_followup_date' => $validated['next_followup_date'] ?? null,
                'created_by' => auth()->id() ?? 1, // Get from authenticated user
                'status' => 'completed'
            ]);

            // Update lead's last follow-up date
            Lead::where('id', $validated['client_id'])
                ->update(['last_followup_date' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'Follow-up created successfully',
                'data' => [
                    'id' => $followUp->id,
                    'date' => $followUp->followup_date->format('Y-m-d'),
                    'time' => $followUp->followup_date->format('H:i'),
                    'type' => $followUp->followup_type,
                    'notes' => $followUp->remark,
                    'nextAction' => $followUp->next_action,
                    'nextFollowUpDate' => $followUp->next_followup_date ? $followUp->next_followup_date->format('Y-m-d') : null
                ]
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create follow-up: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update a follow-up
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $followUp = LeadFollowup::findOrFail($id);

            $validated = $request->validate([
                'type' => 'required|string|max:255',
                'date' => 'required|date',
                'time' => 'nullable|string',
                'notes' => 'required|string',
                'next_action' => 'nullable|string|max:500',
                'next_followup_date' => 'nullable|date|after_or_equal:date'
            ]);

            $followUp->update([
                'followup_type' => $validated['type'],
                'followup_date' => $validated['date'] . ' ' . ($validated['time'] ?? '00:00'),
                'remark' => $validated['notes'],
                'next_action' => $validated['next_action'],
                'next_followup_date' => $validated['next_followup_date'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Follow-up updated successfully',
                'data' => [
                    'id' => $followUp->id,
                    'date' => $followUp->followup_date->format('Y-m-d'),
                    'time' => $followUp->followup_date->format('H:i'),
                    'type' => $followUp->followup_type,
                    'notes' => $followUp->remark,
                    'nextAction' => $followUp->next_action,
                    'nextFollowUpDate' => $followUp->next_followup_date ? $followUp->next_followup_date->format('Y-m-d') : null
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update follow-up: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a follow-up
     */
    public function destroy($id): JsonResponse
    {
        try {
            $followUp = LeadFollowup::findOrFail($id);
            $followUp->delete();

            return response()->json([
                'success' => true,
                'message' => 'Follow-up deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete follow-up: ' . $e->getMessage()
            ], 500);
        }
    }
}
