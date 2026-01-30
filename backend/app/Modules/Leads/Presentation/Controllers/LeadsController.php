<?php

namespace App\Modules\Leads\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Domain\Entities\LeadStatusLog;
use App\Modules\Leads\Domain\Interfaces\LeadRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeadsController extends Controller
{
    /**
     * @var LeadRepositoryInterface
     */
    protected LeadRepositoryInterface $leadRepository;

    /**
     * LeadsController constructor.
     *
     * @param LeadRepositoryInterface $leadRepository
     */
    public function __construct(LeadRepositoryInterface $leadRepository)
    {
        $this->leadRepository = $leadRepository;
    }

    /**
     * Get paginated leads with filters.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = [
                'status' => $request->get('status'),
                'assigned_to' => $request->get('assigned_to'),
                'source' => $request->get('source'),
                'destination' => $request->get('destination'),
                'priority' => $request->get('priority'),
            ];

            $perPage = $request->get('per_page', 15);

            $leads = $this->leadRepository->getPaginated($filters, $perPage);

            return response()->json([
                'success' => true,
                'message' => 'Leads retrieved successfully',
                'data' => [
                    'leads' => $leads->items(),
                    'pagination' => [
                        'current_page' => $leads->currentPage(),
                        'last_page' => $leads->lastPage(),
                        'per_page' => $leads->perPage(),
                        'total' => $leads->total(),
                        'from' => $leads->firstItem(),
                        'to' => $leads->lastItem(),
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving leads',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a single lead by ID.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $lead = $this->leadRepository->findById($id);

            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lead retrieved successfully',
                'data' => [
                    'lead' => [
                        'id' => $lead->id,
                        'client_name' => $lead->client_name,
                        'email' => $lead->email,
                        'phone' => $lead->phone,
                        'source' => $lead->source,
                        'destination' => $lead->destination,
                        'status' => $lead->status,
                        'priority' => $lead->priority,
                        'assigned_to' => $lead->assigned_to,
                        'travel_start_date' => $lead->travel_start_date ? $lead->travel_start_date->format('Y-m-d') : null,
                        'travel_end_date' => $lead->travel_end_date ? $lead->travel_end_date->format('Y-m-d') : null,
                        'adult' => $lead->adult ?? 1,
                        'child' => $lead->child ?? 0,
                        'infant' => $lead->infant ?? 0,
                        'remark' => $lead->remark ?? null,
                        'assigned_user' => $lead->assignedUser ? [
                            'id' => $lead->assignedUser->id,
                            'name' => $lead->assignedUser->name,
                            'email' => $lead->assignedUser->email,
                        ] : null,
                        'created_by' => $lead->created_by,
                        'creator' => $lead->creator ? [
                            'id' => $lead->creator->id,
                            'name' => $lead->creator->name,
                            'email' => $lead->creator->email,
                        ] : null,
                        'followups' => $lead->followups->map(function ($followup) {
                            return [
                                'id' => $followup->id,
                                'remark' => $followup->remark,
                                'reminder_date' => $followup->reminder_date,
                                'reminder_time' => $followup->reminder_time,
                                'is_completed' => $followup->is_completed,
                                'user' => $followup->user ? [
                                    'id' => $followup->user->id,
                                    'name' => $followup->user->name,
                                ] : null,
                                'created_at' => $followup->created_at,
                            ];
                        }),
                        'status_logs' => $lead->statusLogs->map(function ($log) {
                            return [
                                'id' => $log->id,
                                'old_status' => $log->old_status,
                                'new_status' => $log->new_status,
                                'changed_by' => $log->changed_by,
                                'changed_by_user' => $log->changedBy ? [
                                    'id' => $log->changedBy->id,
                                    'name' => $log->changedBy->name,
                                ] : null,
                                'created_at' => $log->created_at,
                            ];
                        }),
                        'created_at' => $lead->created_at,
                        'updated_at' => $lead->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving lead',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new lead.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'source' => 'required|string|max:50',
                'destination' => 'nullable|string|max:255',
                'status' => 'nullable|in:new,proposal,followup,confirmed,cancelled',
                'assigned_to' => 'nullable|exists:users,id',
                'priority' => 'nullable|in:hot,warm,cold',
                'travel_start_date' => 'nullable|date',
                'travel_end_date' => 'nullable|date|after_or_equal:travel_start_date',
                'adult' => 'nullable|integer|min:0|max:99',
                'child' => 'nullable|integer|min:0|max:99',
                'infant' => 'nullable|integer|min:0|max:99',
                'remark' => 'nullable|string',
            ], [
                'client_name.required' => 'Client name is required.',
                'source.required' => 'Source is required.',
                'status.in' => 'Status must be one of: new, proposal, followup, confirmed, cancelled.',
                'priority.in' => 'Priority must be one of: hot, warm, cold.',
                'assigned_to.exists' => 'The selected assigned user does not exist.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();
            if (isset($data['travel_start_date']) && $data['travel_start_date'] === '') {
                $data['travel_start_date'] = null;
            }
            if (isset($data['travel_end_date']) && $data['travel_end_date'] === '') {
                $data['travel_end_date'] = null;
            }
            $data['created_by'] = $request->user()->id;
            $data['status'] = $data['status'] ?? 'new';
            $data['priority'] = $data['priority'] ?? 'warm';

            $lead = $this->leadRepository->create($data);

            return response()->json([
                'success' => true,
                'message' => 'Lead created successfully',
                'data' => [
                    'lead' => [
                        'id' => $lead->id,
                        'client_name' => $lead->client_name,
                        'email' => $lead->email,
                        'phone' => $lead->phone,
                        'source' => $lead->source,
                        'destination' => $lead->destination,
                        'status' => $lead->status,
                        'priority' => $lead->priority,
                        'assigned_to' => $lead->assigned_to,
                        'created_by' => $lead->created_by,
                        'travel_start_date' => $lead->travel_start_date ? $lead->travel_start_date->format('Y-m-d') : null,
                        'travel_end_date' => $lead->travel_end_date ? $lead->travel_end_date->format('Y-m-d') : null,
                        'adult' => $lead->adult,
                        'child' => $lead->child,
                        'infant' => $lead->infant,
                        'remark' => $lead->remark,
                        'created_at' => $lead->created_at,
                        'updated_at' => $lead->updated_at,
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating lead',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a lead.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_name' => 'sometimes|required|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'source' => 'sometimes|required|string|max:50',
                'destination' => 'nullable|string|max:255',
                'status' => 'nullable|in:new,proposal,followup,confirmed,cancelled',
                'assigned_to' => 'nullable|exists:users,id',
                'priority' => 'nullable|in:hot,warm,cold',
                'travel_start_date' => 'nullable|date',
                'travel_end_date' => 'nullable|date|after_or_equal:travel_start_date',
                'adult' => 'nullable|integer|min:0|max:99',
                'child' => 'nullable|integer|min:0|max:99',
                'infant' => 'nullable|integer|min:0|max:99',
                'remark' => 'nullable|string',
            ], [
                'status.in' => 'Status must be one of: new, proposal, followup, confirmed, cancelled.',
                'priority.in' => 'Priority must be one of: hot, warm, cold.',
                'assigned_to.exists' => 'The selected assigned user does not exist.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $lead = $this->leadRepository->update($id, $validator->validated());

            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lead updated successfully',
                'data' => [
                    'lead' => [
                        'id' => $lead->id,
                        'client_name' => $lead->client_name,
                        'email' => $lead->email,
                        'phone' => $lead->phone,
                        'source' => $lead->source,
                        'destination' => $lead->destination,
                        'status' => $lead->status,
                        'priority' => $lead->priority,
                        'assigned_to' => $lead->assigned_to,
                        'travel_start_date' => $lead->travel_start_date ? $lead->travel_start_date->format('Y-m-d') : null,
                        'travel_end_date' => $lead->travel_end_date ? $lead->travel_end_date->format('Y-m-d') : null,
                        'adult' => $lead->adult ?? 1,
                        'child' => $lead->child ?? 0,
                        'infant' => $lead->infant ?? 0,
                        'remark' => $lead->remark ?? null,
                        'created_by' => $lead->created_by,
                        'updated_at' => $lead->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating lead',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Soft delete a lead.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $deleted = $this->leadRepository->delete($id);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lead deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting lead',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Assign a lead to a user.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function assign(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'assigned_to' => 'required|exists:users,id',
            ], [
                'assigned_to.required' => 'The assigned_to field is required.',
                'assigned_to.exists' => 'The selected assigned user does not exist.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $lead = $this->leadRepository->findById($id);

            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            // Save old assigned_to
            $oldAssignedTo = $lead->assigned_to;
            $currentStatus = $lead->status;

            // Update lead assignment
            $lead->update([
                'assigned_to' => $request->assigned_to,
            ]);

            // Log assignment into lead_status_logs
            LeadStatusLog::create([
                'lead_id' => $lead->id,
                'old_status' => $currentStatus,
                'new_status' => 'assigned',
                'changed_by' => $request->user()->id,
                'created_at' => now(),
            ]);

            // Refresh lead with relationships
            $lead->refresh();
            $lead->load(['assignedUser', 'creator', 'followups', 'statusLogs']);

            return response()->json([
                'success' => true,
                'message' => 'Lead assigned successfully',
                'data' => [
                    'lead' => [
                        'id' => $lead->id,
                        'client_name' => $lead->client_name,
                        'email' => $lead->email,
                        'phone' => $lead->phone,
                        'source' => $lead->source,
                        'destination' => $lead->destination,
                        'status' => $lead->status,
                        'priority' => $lead->priority,
                        'assigned_to' => $lead->assigned_to,
                        'assigned_user' => $lead->assignedUser ? [
                            'id' => $lead->assignedUser->id,
                            'name' => $lead->assignedUser->name,
                            'email' => $lead->assignedUser->email,
                        ] : null,
                        'old_assigned_to' => $oldAssignedTo,
                        'status_logs' => $lead->statusLogs->map(function ($log) {
                            return [
                                'id' => $log->id,
                                'old_status' => $log->old_status,
                                'new_status' => $log->new_status,
                                'changed_by' => $log->changed_by,
                                'changed_by_user' => $log->changedBy ? [
                                    'id' => $log->changedBy->id,
                                    'name' => $log->changedBy->name,
                                ] : null,
                                'created_at' => $log->created_at,
                            ];
                        }),
                        'updated_at' => $lead->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while assigning lead',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update lead status.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:proposal,followup,confirmed,cancelled',
            ], [
                'status.required' => 'The status field is required.',
                'status.in' => 'Status must be one of: proposal, followup, confirmed, cancelled.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $lead = $this->leadRepository->findById($id);

            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            // Save old status
            $oldStatus = $lead->status;
            $newStatus = $request->status;

            // Update lead status
            $lead->update([
                'status' => $newStatus,
            ]);

            // Log status change into lead_status_logs
            LeadStatusLog::create([
                'lead_id' => $lead->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => $request->user()->id,
                'created_at' => now(),
            ]);

            // Refresh lead with relationships
            $lead->refresh();
            $lead->load(['assignedUser', 'creator', 'followups', 'statusLogs']);

            return response()->json([
                'success' => true,
                'message' => 'Lead status updated successfully',
                'data' => [
                    'lead' => [
                        'id' => $lead->id,
                        'client_name' => $lead->client_name,
                        'email' => $lead->email,
                        'phone' => $lead->phone,
                        'source' => $lead->source,
                        'destination' => $lead->destination,
                        'status' => $lead->status,
                        'priority' => $lead->priority,
                        'assigned_to' => $lead->assigned_to,
                        'assigned_user' => $lead->assignedUser ? [
                            'id' => $lead->assignedUser->id,
                            'name' => $lead->assignedUser->name,
                            'email' => $lead->assignedUser->email,
                        ] : null,
                        'created_by' => $lead->created_by,
                        'creator' => $lead->creator ? [
                            'id' => $lead->creator->id,
                            'name' => $lead->creator->name,
                            'email' => $lead->creator->email,
                        ] : null,
                        'status_logs' => $lead->statusLogs->map(function ($log) {
                            return [
                                'id' => $log->id,
                                'old_status' => $log->old_status,
                                'new_status' => $log->new_status,
                                'changed_by' => $log->changed_by,
                                'changed_by_user' => $log->changedBy ? [
                                    'id' => $log->changedBy->id,
                                    'name' => $log->changedBy->name,
                                ] : null,
                                'created_at' => $log->created_at,
                            ];
                        }),
                        'updated_at' => $lead->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating lead status',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

