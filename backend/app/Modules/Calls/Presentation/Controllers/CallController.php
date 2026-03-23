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

            $callItems = collect($calls->items())->map(function ($call) {
                $call->recording_available = (bool) $call->recording_url;
                return $call;
            })->all();

            return $this->successResponse([
                'calls' => $callItems,
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
        
        // Gashwa FIX: Handle full URLs that are actually local assets
        $baseUrl = asset('storage');
        $isLocal = false;
        $localPath = null;
        
        if (Str::startsWith($recordingUrl, $baseUrl)) {
            $isLocal = true;
            $localPath = 'public/' . Str::after($recordingUrl, $baseUrl);
        } elseif (Str::startsWith($recordingUrl, ['storage/', 'public/'])) {
            $isLocal = true;
            $localPath = Str::replaceFirst('storage/', 'public/', $recordingUrl);
        }

        if ($isLocal) {
            if (!\Storage::exists($localPath)) {
                return $this->notFoundResponse('Recording file not found on server');
            }

            $stream = \Storage::readStream($localPath);
            if (!$stream) {
                return $this->notFoundResponse('Recording file not accessible');
            }

            return response()->stream(function () use ($stream) {
                if (is_resource($stream)) {
                    fpassthru($stream);
                    fclose($stream);
                }
            }, 200, [
                'Content-Type' => \Storage::mimeType($localPath) ?? 'audio/mpeg',
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

    public function syncMobileCalls(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'calls' => 'required|array',
            'calls.*.phone_number' => 'required|string|max:32',
            'calls.*.call_type' => 'required|string|in:incoming,outgoing,missed',
            'calls.*.duration' => 'required|integer',
            'calls.*.timestamp' => 'required|date_format:Y-m-d H:i:s',
            'calls.*.contact_name' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        try {
            $user = $request->user();
            $syncedCount = 0;
            $skippedCount = 0;

            foreach ($request->input('calls') as $callData) {
                // Check if this call already exists to avoid duplicates
                // Mobile apps might send the same log multiple times if sync fails
                $startTime = $callData['timestamp'];
                $normalizedPhone = CallLog::normalizePhoneNumber($callData['phone_number']);

                // Gashwa IMPROV: Stricter duplicate check using provider_call_id (with safety) OR heuristic matching
                $hasProviderId = !empty($callData['provider_call_id']);
                
                $exists = \App\Modules\Calls\Domain\Entities\CallLog::withoutGlobalScopes()
                    ->where('user_id', $user->id)
                    ->where(function($q) use ($normalizedPhone, $callData, $startTime, $hasProviderId) {
                        if ($hasProviderId) {
                            $q->where('provider_call_id', $callData['provider_call_id']);
                        } else {
                            // If no provider ID, ensure we ONLY match by phone, duration, and time
                            // We use an impossible where to essentially skip the 'orWhere' dependency
                            $q->whereRaw('1 = 0');
                        }
                        
                        $q->orWhere(function($sub) use ($normalizedPhone, $callData, $startTime) {
                            $sub->where(function($qq) use ($normalizedPhone) {
                                $qq->where('from_number_normalized', $normalizedPhone)
                                   ->orWhere('to_number_normalized', $normalizedPhone)
                                   ->orWhere('contact_phone_normalized', $normalizedPhone);
                            })
                            ->where('duration_seconds', $callData['duration'])
                            ->whereBetween('call_started_at', [
                                date('Y-m-d H:i:s', strtotime($startTime) - 1800), // 30 min window
                                date('Y-m-d H:i:s', strtotime($startTime) + 1800)
                            ]);
                        });
                    })
                    ->exists();



                if ($exists) {
                    $skippedCount++;
                    continue;
                }

                // Try to find a matching lead
                $lead = \App\Modules\Leads\Domain\Entities\Lead::where('phone_normalized', $normalizedPhone)
                    ->orWhere('phone', 'like', '%' . $normalizedPhone)
                    ->first();

                $logData = [
                    'company_id' => $user->company_id,
                    'user_id' => $user->id,
                    'lead_id' => $lead?->id,
                    'source' => 'mobile',
                    'status' => 'completed',
                    'duration_seconds' => $callData['duration'],
                    'from_number' => $callData['call_type'] === 'incoming' ? $callData['phone_number'] : $user->phone,
                    'to_number' => $callData['call_type'] === 'outgoing' ? $callData['phone_number'] : $user->phone,
                    'contact_phone' => $callData['phone_number'],
                    'contact_name' => $callData['contact_name'] ?? null,
                    'provider_call_id' => $callData['provider_call_id'] ?? null,
                    'call_started_at' => $startTime,
                    'call_ended_at' => date('Y-m-d H:i:s', strtotime($startTime) + $callData['duration']),
                ];


                CallLog::create($logData);
                $syncedCount++;
            }

            return $this->successResponse([
                'synced_count' => $syncedCount,
                'skipped_count' => $skippedCount,
                'has_updates' => $syncedCount > 0, // Frontend indicator
            ], $syncedCount > 0 ? 'Mobile calls synchronized successfully' : 'No new calls found');

        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to synchronize mobile calls', $e);
        }
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

    public function uploadMobileRecording(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'audio' => 'required|file',
            'phone_number' => 'required|string',
            'timestamp' => 'required|date_format:Y-m-d H:i:s',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        try {
            // Force resolve tenant for test route if not set
            if (!app()->bound('tenant')) {
                $tenant = \App\Models\Company::where('id', 2)->first() ?: \App\Models\Company::first();
                app()->instance('tenant', $tenant);
                config(['tenant.id' => $tenant->id]);
            }

            $user = $request->user();
            $userId = $user ? $user->id : 2; // Default to ID 2 for testing if not auth
            $companyId = $user ? $user->company_id : 1; // Default to ID 1
            
            $phone = $request->input('phone_number');
            $timestamp = $request->input('timestamp');
            \Log::info("Mobile Upload Attempt", ['phone' => $phone, 'timestamp' => $timestamp, 'userId' => $userId]);
            
            $normalizedPhone = \App\Modules\Calls\Domain\Entities\CallLog::normalizePhoneNumber($phone);
            \Log::info("Processing recording match", ['normalized_phone' => $normalizedPhone, 'timestamp' => $timestamp]);

            // Gashwa IMPROV: Extreme time window to handle possible device-server clock drift or timezone offsets (±24 hours fallback)
            $searchTimes = [
                ['start' => date('Y-m-d H:i:s', strtotime($timestamp) - 600), 'end' => date('Y-m-d H:i:s', strtotime($timestamp) + 600)],
                ['start' => date('Y-m-d H:i:s', strtotime($timestamp) - 86400), 'end' => date('Y-m-d H:i:s', strtotime($timestamp) + 86400)]
            ];

            $callLog = null;
            foreach ($searchTimes as $window) {
                $query = \App\Modules\Calls\Domain\Entities\CallLog::withoutGlobalScopes()
                    ->where(function($q) use ($normalizedPhone) {
                        $q->where('from_number_normalized', $normalizedPhone)
                          ->orWhere('to_number_normalized', $normalizedPhone)
                          ->orWhere('contact_phone_normalized', $normalizedPhone)
                          ->orWhere('contact_phone', $normalizedPhone);
                    })
                    ->whereBetween('call_started_at', [$window['start'], $window['end']])
                    ->orderBy('call_started_at', 'desc');
                
                // Try with user first, then without
                $callLog = (clone $query)->where('user_id', $userId)->first() ?: $query->first();
                
                if ($callLog) {
                    \Log::info("Matched call for recording", ['id' => $callLog->id, 'matched_user_id' => $callLog->user_id, 'started_at' => $callLog->call_started_at]);
                    break;
                }
            }



            if (!$callLog) {
                \Log::warning("Call matching failed", ['phone' => $normalizedPhone, 'provided_timestamp' => $timestamp]);
                return $this->notFoundResponse('Call log not found for this recording. Please sync logs first.');
            }


            $path = $request->file('audio')->store('recordings', 'public');
            
            $callLog->update([
                'recording_url' => asset('storage/' . $path),
                'status' => 'completed'
            ]);

            return $this->successResponse([
                'id' => $callLog->id,
                'url' => $callLog->recording_url
            ], 'Recording uploaded successfully');

        } catch (\Throwable $e) {
            \Log::error("Recording Upload Error", ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);
            return $this->serverErrorResponse('Failed to upload recording: ' . $e->getMessage(), $e);
        }
    }

    public function destroy(int $id): JsonResponse
    {
        try {
            $call = CallLog::find($id);
            if (!$call) {
                return $this->notFoundResponse('Call log not found');
            }

            $call->delete();

            return $this->successResponse(null, 'Call log deleted successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to delete call log', $e);
        }
    }
}


