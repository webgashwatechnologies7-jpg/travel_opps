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
            $filters = $request->only(['status', 'assigned_to', 'created_by', 'source', 'destination', 'priority', 'birth_month', 'anniversary_month']);
            $filters['company_id'] = function_exists('tenant') ? tenant('id') : $request->user()?->company_id;

            $perPage = $request->get('per_page', 15);
            $leads = $this->leadRepository->getPaginated($filters, $perPage);

            return $this->successResponse([
                'leads' => array_map([$this, 'formatLeadBasic'], $leads->items()),
                'pagination' => [
                    'current_page' => $leads->currentPage(),
                    'last_page' => $leads->lastPage(),
                    'per_page' => $leads->perPage(),
                    'total' => $leads->total(),
                ],
            ], 'Leads retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('An error occurred while retrieving leads', $e);
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
                'status' => 'nullable|in:new,proposal,followup,confirmed,cancelled',
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
            $data['created_by'] = $request->user()->id;
            $data['status'] = $data['status'] ?? 'new';

            $lead = $this->leadRepository->create($data);

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
                'status' => 'nullable|in:new,proposal,followup,confirmed,cancelled',
                'priority' => 'nullable|in:hot,warm,cold',
                'assigned_to' => 'nullable|exists:users,id',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'client_title' => 'nullable|string|max:10',
                'date_of_birth' => 'nullable|date',
                'marriage_anniversary' => 'nullable|date',
                'remark' => 'nullable|string',
            ]);

            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $lead = $this->leadRepository->update($id, $validator->validated());
            if (!$lead)
                return $this->notFoundResponse('Lead not found');

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
            $validator = Validator::make($request->all(), ['status' => 'required|in:proposal,followup,confirmed,cancelled']);
            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $lead = $this->leadRepository->findById($id);
            if (!$lead)
                return $this->notFoundResponse('Lead not found');

            $oldStatus = $lead->status;
            $lead->update(['status' => $request->status]);

            LeadStatusLog::create([
                'lead_id' => $lead->id,
                'old_status' => $oldStatus,
                'new_status' => $request->status,
                'changed_by' => $request->user()->id,
            ]);

            return $this->successResponse(['lead' => $this->formatLeadFull($lead->fresh())], 'Lead status updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to update status', $e);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────────

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
            'client_title' => $lead->client_title,
            'date_of_birth' => optional($lead->date_of_birth)->format('Y-m-d'),
            'marriage_anniversary' => optional($lead->marriage_anniversary)->format('Y-m-d'),
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
                'reminder_date' => $f->reminder_date,
                'is_completed' => $f->is_completed,
            ]),
            'status_logs' => $lead->statusLogs->map(fn($l) => [
                'id' => $l->id,
                'old_status' => $l->old_status,
                'new_status' => $l->new_status,
                'changed_by_name' => $l->changedBy?->name,
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
