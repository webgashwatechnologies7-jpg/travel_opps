<?php

namespace App\Modules\Leads\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Domain\Entities\LeadStatusLog;
use App\Modules\Leads\Domain\Interfaces\LeadRepositoryInterface;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use App\Models\User;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Notifications\GenericNotification;
use Illuminate\Support\Facades\Notification;

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
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['status', 'assigned_to', 'created_by', 'source', 'destination', 'priority', 'birth_month', 'anniversary_month', 'from_date', 'to_date', 'travel_month', 'service', 'adult', 'description', 'today', 'unassigned', 'created_from', 'created_to', 'search']);
            $filters['company_id'] = function_exists('tenant') ? tenant('id') : $request->user()?->company_id;

            $perPage = $request->get('per_page', 8);
            $leads = $this->leadRepository->getPaginated($filters, $perPage);
            $stats = $this->leadRepository->getSummaryStats(['company_id' => $filters['company_id']]);

            return response()->json([
                'success' => true,
                'message' => 'Leads retrieved successfully',
                'data' => [
                    'leads' => array_map([$this, 'formatLeadBasic'], $leads->items()),
                    'pagination' => [
                        'current_page' => $leads->currentPage(),
                        'last_page' => $leads->lastPage(),
                        'per_page' => $leads->perPage(),
                        'total' => $leads->total(),
                    ],
                    'stats' => $stats,
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get lead analytics data.
     */
    public function analytics(Request $request): JsonResponse
    {
        try {
            $filters = $request->only(['status', 'assigned_to', 'created_by', 'source', 'destination', 'priority', 'birth_month', 'anniversary_month', 'from_date', 'to_date', 'travel_month', 'service', 'adult', 'description', 'today', 'unassigned', 'created_from', 'created_to', 'search']);
            $filters['company_id'] = function_exists('tenant') ? tenant('id') : $request->user()?->company_id;

            $timeframe = $request->get('timeframe', 'month');
            $data = $this->leadRepository->getAnalytics($filters, $timeframe);

            return response()->json([
                'success' => true,
                'message' => 'Analytics retrieved successfully',
                'data' => $data
            ], 200);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Get a single lead by ID.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $lead = $this->leadRepository->findById($id);
            if (!$lead)
                return $this->notFoundResponse('Lead not found');

            return $this->successResponse(['lead' => $this->formatLeadFull($lead)], 'Lead retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve lead', $e);
        }
    }

    /**
     * Create a new lead.
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
                'status' => 'nullable|in:new,processing,proposal,followup,confirmed,cancelled',
                'assigned_to' => 'nullable|exists:users,id',
                'priority' => 'nullable|in:hot,warm,cold',
                'travel_start_date' => 'nullable|date',
                'travel_end_date' => 'nullable|date|after_or_equal:travel_start_date',
                'pax_details' => 'nullable|array',
                'client_title' => 'nullable|string|max:10',
                'date_of_birth' => 'nullable|date',
                'marriage_anniversary' => 'nullable|date',
                'remark' => 'nullable|string',
            ]);

            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $data = $validator->validated();
            $companyId = $request->user()->company_id;

            // Check for duplicates within the same company
            if (!empty($data['phone'])) {
                $exists = Lead::where('company_id', $companyId)
                    ->where('phone', $data['phone'])
                    ->exists();
                if ($exists) {
                    return response()->json([
                        'success' => false,
                        'message' => 'A query with this phone number (' . $data['phone'] . ') already exists in your records.'
                    ], 422);
                }
            }

            if (!empty($data['email'])) {
                $exists = Lead::where('company_id', $companyId)
                    ->where('email', $data['email'])
                    ->exists();
                if ($exists) {
                    return response()->json([
                        'success' => false,
                        'message' => 'A query with this email (' . $data['email'] . ') already exists in your records.'
                    ], 422);
                }
            }

            $data['created_by'] = $request->user()->id;
            $data['status'] = $data['status'] ?? 'new';
            $data['company_id'] = $companyId;

            $lead = $this->leadRepository->create($data);
            $lead = $lead->fresh();

            // Log activity
            \App\Models\QueryHistoryLog::logActivity([
                'lead_id' => $lead->id,
                'activity_type' => 'create',
                'activity_description' => 'Query created from ' . $lead->source,
                'module' => 'leads',
                'record_id' => $lead->id,
                'new_values' => $lead->toArray(),
            ]);

            // Notification logic
            $this->notifyLeadCreation($lead, $request->user());

            return $this->createdResponse(['lead' => $this->formatLeadBasic($lead)], 'Lead created successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create lead', $e);
        }
    }

    /**
     * Update a lead.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_name' => 'sometimes|required|string|max:255',
                'status' => 'nullable|in:new,processing,proposal,followup,confirmed,cancelled',
                'priority' => 'nullable|in:hot,warm,cold',
                'assigned_to' => 'nullable|exists:users,id',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'client_title' => 'nullable|string|max:10',
                'date_of_birth' => 'nullable|date',
                'marriage_anniversary' => 'nullable|date',
                'remark' => 'nullable|string',
                'destination' => 'nullable|string|max:255',
                'travel_start_date' => 'nullable|date',
                'travel_end_date' => 'nullable|date|after_or_equal:travel_start_date',
                'source' => 'nullable|string|max:50',
                'service' => 'nullable|string|max:100',
                'adult' => 'nullable|integer|min:0',
                'child' => 'nullable|integer|min:0',
                'infant' => 'nullable|integer|min:0',
                'pax_details' => 'nullable|array',
            ]);

            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $oldLead = Lead::find($id);
            if (!$oldLead)
                return $this->notFoundResponse('Lead not found');

            // Check if lead is locked
            if ($this->isLeadLocked($oldLead, $request->user())) {
                return response()->json([
                    'success' => false,
                    'message' => 'This query is booked and locked. Please request permission from your manager to make changes.',
                    'is_locked' => true
                ], 403);
            }

            $data = $validator->validated();

            // If status is changed to confirmed, lock it (DISABLED)
            /*
            if (isset($data['status']) && $data['status'] === 'confirmed' && $oldLead->status !== 'confirmed') {
                $data['is_locked'] = true;
                $data['is_unlocked_for_edit'] = false;
            }
            */

            $lead = $this->leadRepository->update($id, $data);

            // Log activity if anything changed
            $allChanges = array_intersect_key($data, array_flip(array_keys($data)));
            if (!empty($allChanges)) {
                $description = 'Lead updated by ' . $request->user()->name;
                if ($oldLead->status === 'confirmed') {
                    $description .= ' [BOOKED QUERY MODIFICATION]';
                }

                \App\Models\QueryHistoryLog::logActivity([
                    'lead_id' => $lead->id,
                    'activity_type' => 'update',
                    'activity_description' => $description,
                    'module' => 'leads',
                    'record_id' => $lead->id,
                    'old_values' => $oldLead->only(array_keys($allChanges)),
                    'new_values' => $allChanges,
                    'metadata' => [
                        'ip' => $request->ip(),
                        'user_agent' => $request->userAgent()
                    ]
                ]);
            }

            return $this->updatedResponse(['lead' => $this->formatLeadBasic($lead)], 'Lead updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to update lead', $e);
        }
    }

    /**
     * Soft delete a lead.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $deleted = $this->leadRepository->delete($id);
            if (!$deleted)
                return $this->notFoundResponse('Lead not found');

            return $this->deletedResponse('Lead deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to delete lead', $e);
        }
    }

    /**
     * Assign a lead to a user.
     */
    public function assign(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), ['assigned_to' => 'required|exists:users,id']);
            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $lead = $this->leadRepository->findById($id);
            if (!$lead)
                return $this->notFoundResponse('Lead not found');

            if (!$request->user()->hasRole(['Admin', 'Company Admin', 'Super Admin'])) {
                if (!in_array((int) $request->assigned_to, $request->user()->getAllSubordinateIds())) {
                    return $this->errorResponse('Permission denied', 403);
                }
            }

            $oldAssignedTo = $lead->assigned_to;
            $lead->update(['assigned_to' => $request->assigned_to]);

            LeadStatusLog::create([
                'lead_id' => $lead->id,
                'old_status' => $lead->status,
                'new_status' => 'assigned',
                'changed_by' => $request->user()->id,
            ]);

            // Log to QueryHistoryLog
            $assignedUser = User::find($request->assigned_to);
            \App\Models\QueryHistoryLog::logActivity([
                'lead_id' => $lead->id,
                'activity_type' => 'assigned',
                'activity_description' => 'Lead assigned to ' . ($assignedUser ? $assignedUser->name : 'User ID: ' . $request->assigned_to),
                'module' => 'leads',
                'record_id' => $lead->id,
                'new_values' => ['assigned_to' => $request->assigned_to],
            ]);

            if ((int) $request->assigned_to !== (int) $oldAssignedTo) {
                PushNotificationService::sendToUsers(
                    [(int) $request->assigned_to],
                    'New lead assigned',
                    'Lead #' . $lead->id . ' has been assigned to you.',
                    ['lead_id' => (string) $lead->id]
                );
            }

            return $this->successResponse(['lead' => $this->formatLeadFull($lead->fresh())], 'Lead assigned successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to assign lead', $e);
        }
    }

    /**
     * Update lead status.
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), ['status' => 'required|in:processing,proposal,followup,confirmed,cancelled']);
            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $lead = $this->leadRepository->findById($id);
            if (!$lead)
                return $this->notFoundResponse('Lead not found');

            // Check if lead is locked
            if ($this->isLeadLocked($lead, $request->user())) {
                return response()->json([
                    'success' => false,
                    'message' => 'This query is booked and locked. Please request permission from your manager to change status.',
                    'is_locked' => true
                ], 403);
            }

            $oldStatus = $lead->status;
            $newStatus = $request->status;

            $updateData = ['status' => $newStatus];

            // If changing to confirmed, lock it automatically (DISABLED)
            /*
            if ($newStatus === 'confirmed' && $oldStatus !== 'confirmed') {
                $updateData['is_locked'] = true;
                $updateData['is_unlocked_for_edit'] = false;
            }
            */

            $lead->update($updateData);

            LeadStatusLog::create([
                'lead_id' => $lead->id,
                'old_status' => $oldStatus,
                'new_status' => $newStatus,
                'changed_by' => $request->user()->id,
            ]);

            // Also log to QueryHistoryLog for history timeline
            \App\Models\QueryHistoryLog::logActivity([
                'lead_id' => $lead->id,
                'activity_type' => 'status_change',
                'activity_description' => 'Status changed from ' . ucfirst($oldStatus) . ' to ' . ucfirst($newStatus) . ($oldStatus === 'confirmed' ? ' [BYPASS]' : ''),
                'module' => 'leads',
                'record_id' => $lead->id,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => $newStatus],
            ]);

            return $this->successResponse(['lead' => $this->formatLeadFull($lead->fresh())], 'Lead status updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to update status', $e);
        }
    }

    /**
     * Bulk assign leads to a user.
     */
    public function bulkAssign(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'ids' => 'required|array',
                'ids.*' => 'exists:leads,id',
                'assigned_to' => 'required|exists:users,id'
            ]);

            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            if (!$request->user()->hasRole(['Admin', 'Company Admin', 'Super Admin', 'Manager'])) {
                if (!in_array((int) $request->assigned_to, $request->user()->getAllSubordinateIds())) {
                    return $this->errorResponse('Permission denied', 403);
                }
            }

            $userId = (int) $request->assigned_to;
            $ids = $request->ids;

            // Fetch leads to log status changes correctly
            $leads = \App\Modules\Leads\Domain\Entities\Lead::whereIn('id', $ids)->get(['id', 'status', 'assigned_to']);

            $this->leadRepository->bulkAssign($ids, $userId);

            foreach ($leads as $lead) {
                LeadStatusLog::create([
                    'lead_id' => $lead->id,
                    'old_status' => $lead->status,
                    'new_status' => 'assigned',
                    'changed_by' => $request->user()->id,
                ]);
            }

            PushNotificationService::sendToUsers(
                [$userId],
                'Multiple Leads Assigned',
                count($ids) . ' new leads have been assigned to you by ' . $request->user()->name,
                ['type' => 'bulk_assignment']
            );

            return $this->successResponse(null, count($ids) . ' leads assigned successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to bulk assign leads', $e);
        }
    }

    /**
     * Bulk delete leads.
     */
    public function bulkDelete(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'ids' => 'required|array',
                'ids.*' => 'exists:leads,id'
            ]);

            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            if (!$request->user()->hasRole(['Admin', 'Company Admin', 'Super Admin'])) {
                return $this->errorResponse('Only administrators can perform bulk deletions', 403);
            }

            $this->leadRepository->bulkDelete($request->ids);

            return $this->successResponse(null, count($request->ids) . ' leads deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to bulk delete leads', $e);
        }
    }

    /**
     * Request unlock for a locked lead.
     */
    public function requestUnlock(Request $request, int $id): JsonResponse
    {
        try {
            $lead = Lead::find($id);
            if (!$lead)
                return $this->notFoundResponse('Lead not found');

            $validator = Validator::make($request->all(), [
                'reason' => 'required|string|max:500'
            ]);
            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $lead->update([
                'unlock_requested' => true,
                'unlock_request_reason' => $request->reason
            ]);

            // Log activity
            \App\Models\QueryHistoryLog::logActivity([
                'lead_id' => $lead->id,
                'activity_type' => 'unlock_request',
                'activity_description' => 'Modification permission requested by ' . $request->user()->name . '. Reason: ' . $request->reason,
                'module' => 'leads',
                'record_id' => $lead->id,
            ]);

            // Notify manager/admin
            $managers = User::whereHas('roles', fn($q) => $q->whereIn('name', ['Admin', 'Company Admin', 'Super Admin', 'Manager']))->get();
            Notification::send($managers, new GenericNotification([
                'type' => 'unlock_request',
                'title' => 'Modification Request',
                'message' => $request->user()->name . ' requested permission to edit booked query #' . $lead->id,
                'action_url' => '/leads/' . $lead->id
            ]));

            return $this->successResponse(null, 'Unlock request submitted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to submit unlock request', $e);
        }
    }

    /**
     * Approve or reject unlock request (Manager Only).
     */
    public function handleUnlockRequest(Request $request, int $id): JsonResponse
    {
        try {
            if (!$request->user()->can('leads_management.approve_unlock') && !$request->user()->hasRole(['Company Admin', 'Super Admin'])) {
                return $this->errorResponse('Only authorized personnel can approve modification requests', 403);
            }

            $validator = Validator::make($request->all(), [
                'action' => 'required|in:approve,reject',
            ]);
            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $lead = Lead::find($id);
            if (!$lead)
                return $this->notFoundResponse('Lead not found');

            if ($request->action === 'approve') {
                $lead->update([
                    'is_unlocked_for_edit' => true,
                    'unlock_requested' => false
                ]);
                $msg = 'request approved';
            } else {
                $lead->update(['unlock_requested' => false]);
                $msg = 'request rejected';
            }

            \App\Models\QueryHistoryLog::logActivity([
                'lead_id' => $lead->id,
                'activity_type' => 'unlock_action',
                'activity_description' => 'Modification ' . $msg . ' by ' . $request->user()->name,
                'module' => 'leads',
                'record_id' => $lead->id,
            ]);

            return $this->successResponse(['lead' => $this->formatLeadBasic($lead->fresh())], 'Modification request ' . $request->action . 'ed successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to handle unlock request', $e);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────────

    private function isLeadLocked(Lead $lead, User $user): bool
    {
        return false;
    }

    private function formatLeadBasic($lead)
    {
        return [
            'id' => $lead->id,
            'client_name' => $lead->client_name,
            'email' => $lead->email,
            'phone' => $lead->phone,
            'source' => $lead->source,
            'destination' => $lead->destination,
            'status' => $lead->status,
            'priority' => $lead->priority,
            'assigned_to' => $lead->assigned_to,
            'assigned_name' => $lead->assignedUser?->name,
            'assigned_user' => $lead->assignedUser ? ['id' => $lead->assignedUser->id, 'name' => $lead->assignedUser->name] : null,
            'client_title' => $lead->client_title,
            'travel_start_date' => optional($lead->travel_start_date)->format('Y-m-d'),
            'travel_end_date' => optional($lead->travel_end_date)->format('Y-m-d'),
            'adult' => $lead->adult ?? 0,
            'child' => $lead->child ?? 0,
            'infant' => $lead->infant ?? 0,
            'service' => $lead->service,
            'remark' => $lead->remark,
            'date_of_birth' => optional($lead->date_of_birth)->format('Y-m-d'),
            'marriage_anniversary' => optional($lead->marriage_anniversary)->format('Y-m-d'),
            'amount' => $lead->getEstimatedValue(),
            'is_locked' => $lead->is_locked,
            'is_unlocked_for_edit' => $lead->is_unlocked_for_edit,
            'unlock_requested' => $lead->unlock_requested,
            'unlock_request_reason' => $lead->unlock_request_reason,
            'created_at' => $lead->created_at,
            'updated_at' => $lead->updated_at,
        ];
    }

    private function formatLeadFull($lead)
    {
        return array_merge($this->formatLeadBasic($lead), [
            'travel_start_date' => optional($lead->travel_start_date)->format('Y-m-d'),
            'travel_end_date' => optional($lead->travel_end_date)->format('Y-m-d'),
            'adult' => $lead->adult ?? 1,
            'child' => $lead->child ?? 0,
            'infant' => $lead->infant ?? 0,
            'pax_details' => $lead->pax_details,
            'remark' => $lead->remark,
            'assigned_user' => $lead->assignedUser ? ['id' => $lead->assignedUser->id, 'name' => $lead->assignedUser->name] : null,
            'creator' => $lead->creator ? ['id' => $lead->creator->id, 'name' => $lead->creator->name] : null,
            'followups' => $lead->followups->map(fn($f) => [
                'id' => $f->id,
                'remark' => $f->remark,
                'reminder_date' => optional($f->reminder_date)->toDateString(),
                'reminder_time' => $f->reminder_time,
                'is_completed' => $f->is_completed,
                'created_at' => $f->created_at,
                'user' => $f->user ? ['id' => $f->user->id, 'name' => $f->user->name] : null,
            ]),
            'status_logs' => $lead->statusLogs->map(fn($l) => [
                'id' => $l->id,
                'old_status' => $l->old_status,
                'new_status' => $l->new_status,
                'changed_by_name' => $l->changedBy?->name,
            ]),
            'activity_timeline' => \App\Models\QueryHistoryLog::where('lead_id', $lead->id)
                ->with('user')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($h) => [
                    'id' => $h->id,
                    'type' => $h->activity_type,
                    'title' => strtoupper($h->activity_type),
                    'description' => $h->activity_description,
                    'created_at' => $h->created_at,
                    'user' => $h->user ? ['id' => $h->user->id, 'name' => $h->user->name] : null,
                ]),
            'created_at' => $lead->created_at,
        ]);
    }

    private function notifyLeadCreation($lead, $creator)
    {
        $userIds = collect();
        if ($lead->assigned_to && $lead->assigned_to != $creator->id)
            $userIds->push($lead->assigned_to);

        $admins = User::whereHas('roles', fn($q) => $q->whereIn('name', ['Admin', 'Company Admin', 'Super Admin']))
            ->where('id', '!=', $creator->id)
            ->pluck('id');

        $users = User::whereIn('id', $userIds->merge($admins)->unique())->get();
        if ($users->isNotEmpty()) {
            Notification::send($users, new GenericNotification([
                'type' => 'new_query',
                'title' => 'New Query Received',
                'message' => 'Query from ' . $lead->client_name,
                'action_url' => '/leads/' . $lead->id
            ]));
        }
    }
}
