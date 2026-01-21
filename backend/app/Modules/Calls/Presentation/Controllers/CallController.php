<?php

namespace App\Modules\Calls\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Calls\Domain\Entities\CallLog;
use App\Modules\Calls\Domain\Entities\CallNote;
use App\Modules\Calls\Domain\Entities\PhoneNumberMapping;
use App\Modules\Calls\Infrastructure\ExternalServices\TelephonyService;
use App\Traits\StandardApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class CallController extends Controller
{
    use StandardApiResponse;

    public function index(Request $request): JsonResponse
    {
        try {
            $query = CallLog::with([
                'employee:id,name,email',
                'lead:id,client_name,phone',
                'notes.user:id,name',
            ])->orderByDesc('call_started_at');

            if ($request->filled('employee_id')) {
                $query->where('user_id', $request->input('employee_id'));
            }

            if ($request->filled('lead_id')) {
                $query->where('lead_id', $request->input('lead_id'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('mapping_status')) {
                $query->where('mapping_status', $request->input('mapping_status'));
            }

            if ($request->filled('source')) {
                $query->where('source', $request->input('source'));
            }

            if ($request->filled('phone_number')) {
                $normalized = CallLog::normalizePhoneNumber($request->input('phone_number'));
                $query->where(function ($q) use ($normalized) {
                    $q->where('from_number_normalized', 'like', '%' . $normalized)
                        ->orWhere('to_number_normalized', 'like', '%' . $normalized)
                        ->orWhere('mapped_number_normalized', 'like', '%' . $normalized)
                        ->orWhere('contact_phone_normalized', 'like', '%' . $normalized);
                });
            }

            if ($request->filled('duration_min')) {
                $query->where('duration_seconds', '>=', (int) $request->input('duration_min'));
            }

            if ($request->filled('duration_max')) {
                $query->where('duration_seconds', '<=', (int) $request->input('duration_max'));
            }

            if ($request->filled('date_from') || $request->filled('date_to')) {
                $from = $request->filled('date_from') ? $request->input('date_from') : now()->subYear()->toDateString();
                $to = $request->filled('date_to') ? $request->input('date_to') : now()->toDateString();
                $query->whereBetween('call_started_at', [
                    $from . ' 00:00:00',
                    $to . ' 23:59:59',
                ]);
            }

            $perPage = (int) $request->input('per_page', 15);
            $calls = $query->paginate($perPage);

            return $this->successResponse([
                'calls' => $calls->items(),
                'pagination' => [
                    'current_page' => $calls->currentPage(),
                    'last_page' => $calls->lastPage(),
                    'per_page' => $calls->perPage(),
                    'total' => $calls->total(),
                    'from' => $calls->firstItem(),
                    'to' => $calls->lastItem(),
                ],
            ], 'Call logs retrieved successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to retrieve call logs', $e);
        }
    }

    public function show(int $id): JsonResponse
    {
        try {
            $call = CallLog::with(['employee:id,name,email', 'lead:id,client_name,phone', 'notes.user:id,name'])
                ->find($id);

            if (!$call) {
                return $this->notFoundResponse('Call not found');
            }

            return $this->successResponse([
                'call' => $call,
                'recording_available' => (bool) $call->recording_url,
            ], 'Call retrieved successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to retrieve call', $e);
        }
    }

    public function leadHistory(int $leadId): JsonResponse
    {
        try {
            $calls = CallLog::with(['employee:id,name,email', 'notes.user:id,name'])
                ->where('lead_id', $leadId)
                ->orderByDesc('call_started_at')
                ->get();

            $totalCalls = $calls->count();
            $totalTalkTime = $calls->sum('duration_seconds');

            return $this->successResponse([
                'calls' => $calls,
                'summary' => [
                    'total_calls' => $totalCalls,
                    'total_talk_time_seconds' => $totalTalkTime,
                ],
            ], 'Lead call history retrieved successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to retrieve lead calls', $e);
        }
    }

    public function storeNote(Request $request, int $callId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'note' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        try {
            $call = CallLog::find($callId);
            if (!$call) {
                return $this->notFoundResponse('Call not found');
            }

            $note = CallNote::create([
                'company_id' => $call->company_id,
                'call_log_id' => $call->id,
                'user_id' => $request->user()->id,
                'note' => $validator->validated()['note'],
            ]);

            $note->load('user:id,name');

            return $this->createdResponse([
                'note' => $note,
            ], 'Call note added successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to add call note', $e);
        }
    }

    public function updateNote(Request $request, int $callId, int $noteId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'note' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        try {
            $note = CallNote::where('call_log_id', $callId)->find($noteId);
            if (!$note) {
                return $this->notFoundResponse('Call note not found');
            }

            $note->update([
                'note' => $validator->validated()['note'],
            ]);

            $note->load('user:id,name');

            return $this->updatedResponse([
                'note' => $note,
            ], 'Call note updated successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to update call note', $e);
        }
    }

    public function clickToCall(Request $request, TelephonyService $telephonyService): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'to_number' => 'required|string|max:32',
            'lead_id' => 'nullable|exists:leads,id',
            'employee_id' => 'nullable|exists:users,id',
            'from_number' => 'nullable|string|max:32',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        if (!$telephonyService->isConfigured()) {
            return $this->errorResponse('Telephony provider is not configured', 422);
        }

        try {
            $employeeId = $request->input('employee_id') ?? $request->user()->id;
            $fromNumber = $request->input('from_number') ?? $telephonyService->getDefaultFromNumber();

            if (!$fromNumber) {
                return $this->errorResponse('Caller number is missing or not configured', 422);
            }

            $normalizedFrom = CallLog::normalizePhoneNumber($fromNumber);
            $mapping = PhoneNumberMapping::where('user_id', $employeeId)
                ->where('normalized_phone', $normalizedFrom)
                ->first();

            if (!$mapping) {
                return $this->errorResponse('Selected outgoing number is not mapped to this employee', 422);
            }

            $result = $telephonyService->initiateCall($fromNumber, $request->input('to_number'));
            if (!$result['success']) {
                return $this->errorResponse($result['message'] ?? 'Failed to initiate call', 500);
            }

            $call = CallLog::create([
                'company_id' => $request->user()->company_id,
                'user_id' => $employeeId,
                'lead_id' => $request->input('lead_id'),
                'source' => 'crm',
                'status' => $result['status'] ?? 'queued',
                'provider' => $result['provider'] ?? $telephonyService->getProvider(),
                'provider_call_id' => $result['provider_call_id'] ?? null,
                'from_number' => $fromNumber,
                'to_number' => $request->input('to_number'),
                'mapped_number' => $mapping?->phone_number,
                'mapping_status' => 'mapped',
                'call_started_at' => now(),
            ]);

            return $this->createdResponse([
                'call' => $call,
            ], 'Call initiated successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to initiate call', $e);
        }
    }

    public function recording(int $callId, TelephonyService $telephonyService)
    {
        $call = CallLog::find($callId);
        if (!$call) {
            return $this->notFoundResponse('Call not found');
        }

        if (!$call->recording_url) {
            return $this->notFoundResponse('Recording not available');
        }

        $recordingUrl = $call->recording_url;
        if (Str::startsWith($recordingUrl, ['storage/', 'public/'])) {
            $path = Str::replaceFirst('storage/', 'public/', $recordingUrl);
            if (!\Storage::exists($path)) {
                return $this->notFoundResponse('Recording file not found');
            }

            $stream = \Storage::readStream($path);
            if (!$stream) {
                return $this->notFoundResponse('Recording file not accessible');
            }

            return response()->stream(function () use ($stream) {
                fpassthru($stream);
                if (is_resource($stream)) {
                    fclose($stream);
                }
            }, 200, [
                'Content-Type' => \Storage::mimeType($path) ?? 'audio/mpeg',
                'Cache-Control' => 'no-store',
            ]);
        }

        $response = $telephonyService->fetchRecording($recordingUrl, $call->provider);
        if (!$response['success']) {
            $status = $response['status'] ?? 500;
            if (in_array($status, [401, 403, 404], true)) {
                return $this->errorResponse('Recording URL expired or unavailable', 410);
            }
            return $this->errorResponse('Failed to fetch recording', $status);
        }

        return response($response['body'], 200, [
            'Content-Type' => $response['content_type'] ?? 'audio/mpeg',
            'Cache-Control' => 'no-store',
        ]);
    }

    public function listMappings(Request $request): JsonResponse
    {
        try {
            $mappings = PhoneNumberMapping::with('user:id,name,email')
                ->orderBy('created_at', 'desc')
                ->get();

            return $this->successResponse([
                'mappings' => $mappings,
            ], 'Mappings retrieved successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to retrieve mappings', $e);
        }
    }

    public function storeMapping(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'phone_number' => 'required|string|max:32',
            'label' => 'nullable|string|max:50',
            'contact_name' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        try {
            $data = $validator->validated();
            $data['company_id'] = $request->user()->company_id;

            $mapping = PhoneNumberMapping::create($data);
            $mapping->load('user:id,name,email');

            return $this->createdResponse([
                'mapping' => $mapping,
            ], 'Mapping created successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to create mapping', $e);
        }
    }

    public function updateMapping(Request $request, int $mappingId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'sometimes|exists:users,id',
            'phone_number' => 'sometimes|string|max:32',
            'label' => 'nullable|string|max:50',
            'contact_name' => 'nullable|string|max:100',
            'is_active' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        try {
            $mapping = PhoneNumberMapping::find($mappingId);
            if (!$mapping) {
                return $this->notFoundResponse('Mapping not found');
            }

            $mapping->update($validator->validated());
            $mapping->load('user:id,name,email');

            return $this->updatedResponse([
                'mapping' => $mapping,
            ], 'Mapping updated successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to update mapping', $e);
        }
    }

    public function deleteMapping(int $mappingId): JsonResponse
    {
        try {
            $mapping = PhoneNumberMapping::find($mappingId);
            if (!$mapping) {
                return $this->notFoundResponse('Mapping not found');
            }

            $mapping->delete();

            return $this->deletedResponse('Mapping deleted successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to delete mapping', $e);
        }
    }
}
