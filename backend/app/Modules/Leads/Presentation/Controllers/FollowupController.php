<?php

namespace App\Modules\Leads\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Models\QueryHistoryLog;
use App\Modules\Leads\Domain\Entities\LeadFollowup;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FollowupController extends Controller
{
    /**
     * Create a new followup.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'lead_id' => 'required|exists:leads,id',
                'remark' => 'nullable|string',
                'reminder_date' => 'nullable|date',
                'reminder_time' => 'nullable|date_format:H:i:s',
            ], [
                'lead_id.required' => 'The lead_id field is required.',
                'lead_id.exists' => 'The selected lead does not exist.',
                'reminder_date.date' => 'The reminder_date must be a valid date.',
                'reminder_time.date_format' => 'The reminder_time must be in HH:MM:SS format.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Ensure user is authenticated
            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            $followup = LeadFollowup::create([
                'lead_id' => $request->lead_id,
                'user_id' => $request->user()->id,
                'remark' => $request->remark ?? null,
                'reminder_date' => $request->reminder_date ?? null,
                'reminder_time' => $request->reminder_time ?? null,
                'is_completed' => false,
            ]);

            // Load lead relationship
            $followup->load(['lead.assignedUser', 'lead.creator', 'user']);

            QueryHistoryLog::logActivity([
                'lead_id' => $followup->lead_id,
                'activity_type' => 'followup_created',
                'activity_description' => 'Followup added' . ($followup->remark ? ': ' . \Str::limit($followup->remark, 80) : '') . ($followup->reminder_date ? ' (Reminder: ' . $followup->reminder_date->format('d M Y') . ')' : ''),
                'module' => 'followup',
                'record_id' => $followup->id,
                'metadata' => [
                    'reminder_date' => $followup->reminder_date?->toDateString(),
                    'reminder_time' => $followup->reminder_time,
                ],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Followup created successfully',
                'data' => [
                    'followup' => [
                        'id' => $followup->id,
                        'lead_id' => $followup->lead_id,
                        'lead' => $followup->lead ? [
                            'id' => $followup->lead->id,
                            'client_name' => $followup->lead->client_name,
                            'email' => $followup->lead->email,
                            'phone' => $followup->lead->phone,
                            'source' => $followup->lead->source,
                            'destination' => $followup->lead->destination,
                            'status' => $followup->lead->status,
                            'priority' => $followup->lead->priority,
                            'assigned_to' => $followup->lead->assigned_to,
                            'assigned_user' => $followup->lead->assignedUser ? [
                                'id' => $followup->lead->assignedUser->id,
                                'name' => $followup->lead->assignedUser->name,
                                'email' => $followup->lead->assignedUser->email,
                            ] : null,
                        ] : null,
                        'user_id' => $followup->user_id,
                        'user' => $followup->user ? [
                            'id' => $followup->user->id,
                            'name' => $followup->user->name,
                            'email' => $followup->user->email,
                        ] : null,
                        'remark' => $followup->remark,
                        'reminder_date' => $followup->reminder_date,
                        'reminder_time' => $followup->reminder_time,
                        'is_completed' => $followup->is_completed,
                        'created_at' => $followup->created_at,
                        'updated_at' => $followup->updated_at,
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating followup',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Mark followup as completed.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function complete(int $id): JsonResponse
    {
        try {
            $followup = LeadFollowup::with(['lead.assignedUser', 'lead.creator', 'user'])->find($id);

            if (!$followup) {
                return response()->json([
                    'success' => false,
                    'message' => 'Followup not found',
                ], 404);
            }

            $followup->update([
                'is_completed' => true,
            ]);

            $followup->refresh();
            $followup->load(['lead.assignedUser', 'lead.creator', 'user']);

            return response()->json([
                'success' => true,
                'message' => 'Followup marked as completed',
                'data' => [
                    'followup' => [
                        'id' => $followup->id,
                        'lead_id' => $followup->lead_id,
                        'lead' => $followup->lead ? [
                            'id' => $followup->lead->id,
                            'client_name' => $followup->lead->client_name,
                            'email' => $followup->lead->email,
                            'phone' => $followup->lead->phone,
                            'source' => $followup->lead->source,
                            'destination' => $followup->lead->destination,
                            'status' => $followup->lead->status,
                            'priority' => $followup->lead->priority,
                            'assigned_to' => $followup->lead->assigned_to,
                            'assigned_user' => $followup->lead->assignedUser ? [
                                'id' => $followup->lead->assignedUser->id,
                                'name' => $followup->lead->assignedUser->name,
                                'email' => $followup->lead->assignedUser->email,
                            ] : null,
                        ] : null,
                        'user_id' => $followup->user_id,
                        'user' => $followup->user ? [
                            'id' => $followup->user->id,
                            'name' => $followup->user->name,
                            'email' => $followup->user->email,
                        ] : null,
                        'remark' => $followup->remark,
                        'reminder_date' => $followup->reminder_date,
                        'reminder_time' => $followup->reminder_time,
                        'is_completed' => $followup->is_completed,
                        'created_at' => $followup->created_at,
                        'updated_at' => $followup->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while completing followup',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a followup/note.
     * PUT /api/followups/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $followup = LeadFollowup::with(['lead.assignedUser', 'lead.creator', 'user'])->find($id);

            if (!$followup) {
                return response()->json([
                    'success' => false,
                    'message' => 'Followup not found',
                ], 404);
            }

            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            // Simple authorization: only creator can edit (adjust later for admin roles if needed)
            if ((int) $followup->user_id !== (int) $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not allowed to update this item',
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'remark' => 'nullable|string',
                'reminder_date' => 'nullable|date',
                'reminder_time' => 'nullable|date_format:H:i:s',
            ], [
                'reminder_date.date' => 'The reminder_date must be a valid date.',
                'reminder_time.date_format' => 'The reminder_time must be in HH:MM:SS format.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $followup->update($validator->validated());
            $followup->refresh();
            $followup->load(['lead.assignedUser', 'lead.creator', 'user']);

            return response()->json([
                'success' => true,
                'message' => 'Followup updated successfully',
                'data' => [
                    'followup' => [
                        'id' => $followup->id,
                        'lead_id' => $followup->lead_id,
                        'user_id' => $followup->user_id,
                        'user' => $followup->user ? [
                            'id' => $followup->user->id,
                            'name' => $followup->user->name,
                            'email' => $followup->user->email,
                        ] : null,
                        'remark' => $followup->remark,
                        'reminder_date' => $followup->reminder_date,
                        'reminder_time' => $followup->reminder_time,
                        'is_completed' => $followup->is_completed,
                        'created_at' => $followup->created_at,
                        'updated_at' => $followup->updated_at,
                    ],
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating followup',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a followup/note.
     * DELETE /api/followups/{id}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $followup = LeadFollowup::find($id);

            if (!$followup) {
                return response()->json([
                    'success' => false,
                    'message' => 'Followup not found',
                ], 404);
            }

            if (!$request->user()) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated',
                ], 401);
            }

            // Simple authorization: only creator can delete (adjust later for admin roles if needed)
            if ((int) $followup->user_id !== (int) $request->user()->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not allowed to delete this item',
                ], 403);
            }

            $followup->delete();

            return response()->json([
                'success' => true,
                'message' => 'Followup deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting followup',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get today's followups.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function today(Request $request): JsonResponse
    {
        try {
            $today = now()->toDateString();

            $followups = LeadFollowup::with(['lead.assignedUser', 'lead.creator', 'user'])
                ->where('reminder_date', $today)
                ->where('is_completed', false)
                ->orderBy('reminder_time', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Today\'s followups retrieved successfully',
                'data' => [
                    'followups' => $followups->map(function ($followup) {
                        return [
                            'id' => $followup->id,
                            'lead_id' => $followup->lead_id,
                            'lead' => $followup->lead ? [
                                'id' => $followup->lead->id,
                                'client_name' => $followup->lead->client_name,
                                'email' => $followup->lead->email,
                                'phone' => $followup->lead->phone,
                                'source' => $followup->lead->source,
                                'destination' => $followup->lead->destination,
                                'status' => $followup->lead->status,
                                'priority' => $followup->lead->priority,
                                'assigned_to' => $followup->lead->assigned_to,
                                'assigned_user' => $followup->lead->assignedUser ? [
                                    'id' => $followup->lead->assignedUser->id,
                                    'name' => $followup->lead->assignedUser->name,
                                    'email' => $followup->lead->assignedUser->email,
                                ] : null,
                            ] : null,
                            'user_id' => $followup->user_id,
                            'user' => $followup->user ? [
                                'id' => $followup->user->id,
                                'name' => $followup->user->name,
                                'email' => $followup->user->email,
                            ] : null,
                            'remark' => $followup->remark,
                            'reminder_date' => $followup->reminder_date,
                            'reminder_time' => $followup->reminder_time,
                            'is_completed' => $followup->is_completed,
                            'created_at' => $followup->created_at,
                        ];
                    }),
                    'count' => $followups->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving today\'s followups',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get overdue followups.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function overdue(Request $request): JsonResponse
    {
        try {
            $today = now()->toDateString();

            $followups = LeadFollowup::with(['lead.assignedUser', 'lead.creator', 'user'])
                ->where('reminder_date', '<', $today)
                ->where('is_completed', false)
                ->orderBy('reminder_date', 'asc')
                ->orderBy('reminder_time', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Overdue followups retrieved successfully',
                'data' => [
                    'followups' => $followups->map(function ($followup) {
                        return [
                            'id' => $followup->id,
                            'lead_id' => $followup->lead_id,
                            'lead' => $followup->lead ? [
                                'id' => $followup->lead->id,
                                'client_name' => $followup->lead->client_name,
                                'email' => $followup->lead->email,
                                'phone' => $followup->lead->phone,
                                'source' => $followup->lead->source,
                                'destination' => $followup->lead->destination,
                                'status' => $followup->lead->status,
                                'priority' => $followup->lead->priority,
                                'assigned_to' => $followup->lead->assigned_to,
                                'assigned_user' => $followup->lead->assignedUser ? [
                                    'id' => $followup->lead->assignedUser->id,
                                    'name' => $followup->lead->assignedUser->name,
                                    'email' => $followup->lead->assignedUser->email,
                                ] : null,
                            ] : null,
                            'user_id' => $followup->user_id,
                            'user' => $followup->user ? [
                                'id' => $followup->user->id,
                                'name' => $followup->user->name,
                                'email' => $followup->user->email,
                            ] : null,
                            'remark' => $followup->remark,
                            'reminder_date' => $followup->reminder_date,
                            'reminder_time' => $followup->reminder_time,
                            'is_completed' => $followup->is_completed,
                            'created_at' => $followup->created_at,
                        ];
                    }),
                    'count' => $followups->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving overdue followups',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

