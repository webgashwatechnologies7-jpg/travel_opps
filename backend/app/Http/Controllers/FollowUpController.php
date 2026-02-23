<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Modules\Leads\Domain\Entities\LeadFollowup;
use App\Modules\Leads\Domain\Entities\Lead;

class FollowUpController extends Controller
{
    /**
     * Format a follow-up record consistently.
     */
    private function formatFollowUp(LeadFollowup $followUp): array
    {
        return [
            'id' => $followUp->id,
            'date' => $followUp->followup_date ? $followUp->followup_date->format('Y-m-d') : $followUp->created_at->format('Y-m-d'),
            'time' => $followUp->followup_date ? $followUp->followup_date->format('H:i') : $followUp->created_at->format('H:i'),
            'type' => $followUp->followup_type,
            'notes' => $followUp->remark,
            'nextAction' => $followUp->next_action,
            'nextFollowUpDate' => $followUp->next_followup_date ? $followUp->next_followup_date->format('Y-m-d') : null,
            'createdBy' => $followUp->creator ? $followUp->creator->name : 'Unknown',
            'createdAt' => $followUp->created_at->format('Y-m-d H:i:s'),
        ];
    }

    /**
     * Get follow-ups for a specific client/lead.
     */
    public function getClientFollowUps($clientId): JsonResponse
    {
        try {
            $followUps = LeadFollowup::where('lead_id', $clientId)
                ->with('creator')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($f) => $this->formatFollowUp($f));

            return $this->successResponse($followUps, 'Follow-ups retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve follow-ups', $e);
        }
    }

    /**
     * Store a new follow-up.
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
                'next_followup_date' => 'nullable|date|after_or_equal:date',
            ]);

            $followUp = LeadFollowup::create([
                'lead_id' => $validated['client_id'],
                'followup_type' => $validated['type'],
                'followup_date' => $validated['date'] . ' ' . ($validated['time'] ?? '00:00'),
                'remark' => $validated['notes'],
                'next_action' => $validated['next_action'] ?? null,
                'next_followup_date' => $validated['next_followup_date'] ?? null,
                'created_by' => auth()->id() ?? 1,
                'status' => 'completed',
            ]);

            Lead::where('id', $validated['client_id'])->update(['last_followup_date' => now()]);

            return $this->createdResponse($this->formatFollowUp($followUp), 'Follow-up created successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse('Validation failed', 422, $e->errors());
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create follow-up', $e);
        }
    }

    /**
     * Update a follow-up.
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
                'next_followup_date' => 'nullable|date|after_or_equal:date',
            ]);

            $followUp->update([
                'followup_type' => $validated['type'],
                'followup_date' => $validated['date'] . ' ' . ($validated['time'] ?? '00:00'),
                'remark' => $validated['notes'],
                'next_action' => $validated['next_action'] ?? null,
                'next_followup_date' => $validated['next_followup_date'] ?? null,
            ]);

            return $this->updatedResponse($this->formatFollowUp($followUp->fresh()), 'Follow-up updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->errorResponse('Validation failed', 422, $e->errors());
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to update follow-up', $e);
        }
    }

    /**
     * Delete a follow-up.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $followUp = LeadFollowup::findOrFail($id);
            $followUp->delete();

            return $this->deletedResponse('Follow-up deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to delete follow-up', $e);
        }
    }
}
