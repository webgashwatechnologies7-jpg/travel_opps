<?php

namespace App\Modules\Calls\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Calls\Domain\Entities\CallLog;
use App\Modules\Calls\Domain\Entities\PhoneNumberMapping;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;

class CallWebhookController extends Controller
{
    public function twilio(Request $request): JsonResponse
    {
        if (config('services.telephony.webhook_skip_signature')) {
            return $this->handleWebhook($request, 'twilio');
        }

        $signatureCheck = $this->validateTwilioSignature($request);
        if ($signatureCheck !== true) {
            return response()->json([
                'success' => false,
                'message' => $signatureCheck,
            ], 403);
        }

        return $this->handleWebhook($request, 'twilio');
    }

    public function exotel(Request $request): JsonResponse
    {
        if (config('services.telephony.webhook_skip_signature')) {
            return $this->handleWebhook($request, 'exotel');
        }

        $signatureCheck = $this->validateExotelSignature($request);
        if ($signatureCheck !== true) {
            return response()->json([
                'success' => false,
                'message' => $signatureCheck,
            ], 403);
        }

        return $this->handleWebhook($request, 'exotel');
    }

    private function handleWebhook(Request $request, string $provider): JsonResponse
    {
        try {
            $payload = $request->all();

            $providerCallId = $this->getFirstValue($payload, [
                'CallSid',
                'call_sid',
                'callSid',
                'Call.Sid',
            ]);

            $from = $this->getFirstValue($payload, ['From', 'from', 'Call.From', 'caller']);
            $to = $this->getFirstValue($payload, ['To', 'to', 'Call.To', 'called']);
            $status = $this->mapStatus($this->getFirstValue($payload, ['CallStatus', 'status', 'Call.Status']));
            $duration = (int) $this->getFirstValue($payload, [
                'CallDuration',
                'Duration',
                'duration',
                'call_duration',
                'Call.Duration',
                'DialDuration',
                'DialCallDuration',
                'ConversationDuration',
                'call_duration_seconds',
            ], 0);
            $recordingUrl = $this->getFirstValue($payload, [
                'RecordingUrl',
                'RecordingURL',
                'recording_url',
                'CallRecordingUrl',
                'recordingUrl',
                'Call.RecordingUrl',
                'Call.RecordingURL',
                'record_url',
            ]);
            $recordingSid = $this->getFirstValue($payload, ['RecordingSid', 'recording_sid']);

            if ($provider === 'twilio' && $recordingUrl && !Str::endsWith($recordingUrl, ['.mp3', '.wav'])) {
                $recordingUrl .= '.mp3';
            }

            $callStartedAt = $this->parseTimestamp($this->getFirstValue($payload, ['StartTime', 'Call.StartTime', 'start_time']));
            $callEndedAt = $this->parseTimestamp($this->getFirstValue($payload, ['EndTime', 'Call.EndTime', 'end_time']));

            if ($status === 'completed' && $duration === 0 && $callStartedAt && $callEndedAt) {
                $duration = Carbon::parse($callStartedAt)->diffInSeconds(Carbon::parse($callEndedAt));
            }

            $normalizedFrom = CallLog::normalizePhoneNumber($from ?? '');
            $normalizedTo = CallLog::normalizePhoneNumber($to ?? '');

            $existingCall = null;
            if ($providerCallId) {
                $existingCall = CallLog::where('provider_call_id', $providerCallId)->first();
            }

            $companyId = $existingCall?->company_id;
            if (!$companyId && app()->bound('tenant')) {
                $tenant = app('tenant');
                $companyId = is_object($tenant) && isset($tenant->id) ? $tenant->id : null;
            }

            $mapping = $this->resolveMapping($normalizedFrom, $normalizedTo, $companyId);
            if (!$companyId && $mapping?->company_id) {
                $companyId = $mapping->company_id;
            }

            if ($existingCall && $mapping && $existingCall->company_id && $mapping->company_id !== $existingCall->company_id) {
                Log::warning('Call webhook mapping company mismatch', [
                    'provider' => $provider,
                    'provider_call_id' => $providerCallId,
                    'existing_company_id' => $existingCall->company_id,
                    'mapping_company_id' => $mapping->company_id,
                ]);
                $mapping = null;
            }

            $lead = $this->resolveLead($normalizedFrom, $normalizedTo, $companyId);
            if (!$companyId && $lead?->company_id) {
                $companyId = $lead->company_id;
            }

            if (!$companyId) {
                Log::warning('Call webhook missing company context', [
                    'provider' => $provider,
                    'provider_call_id' => $providerCallId,
                    'from' => $from,
                    'to' => $to,
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Webhook received without company context',
                ], 200);
            }

            $callData = [
                'company_id' => $companyId,
                'user_id' => $mapping?->user_id,
                'lead_id' => $lead?->id,
                'source' => $existingCall?->source ?? 'mobile',
                'status' => $status,
                'provider' => $provider,
                'provider_call_id' => $providerCallId,
                'recording_sid' => $recordingSid,
                'recording_url' => $recordingUrl,
                'duration_seconds' => $duration,
                'from_number' => $from,
                'to_number' => $to,
                'mapped_number' => $mapping?->phone_number,
                'mapping_status' => $mapping ? 'mapped' : 'unmapped',
                'contact_name' => $lead?->client_name ?? $mapping?->contact_name,
                'contact_phone' => $lead?->phone ?? $this->getContactPhone($normalizedFrom, $normalizedTo),
                'call_started_at' => $callStartedAt ?? $existingCall?->call_started_at,
                'call_ended_at' => $callEndedAt ?? $existingCall?->call_ended_at,
            ];

            if ($status === 'completed' && !$callData['call_ended_at']) {
                $callData['call_ended_at'] = now();
            }

            if ($callData['call_started_at'] && $duration > 0 && !$callEndedAt) {
                $callData['call_ended_at'] = Carbon::parse($callData['call_started_at'])->addSeconds($duration);
            }

            if ($existingCall) {
                $existingCall->update(array_filter($callData, function ($value) {
                    return $value !== null && $value !== '';
                }));
                $call = $existingCall->refresh();
            } else {
                $call = CallLog::create($callData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Webhook processed successfully',
                'data' => [
                    'call_id' => $call->id,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Call webhook error', [
                'provider' => $provider,
                'error' => $e->getMessage(),
                'payload' => $request->all(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Webhook processing failed',
            ], 500);
        }
    }

    private function resolveLead(?string $normalizedFrom, ?string $normalizedTo, ?int $companyId): ?Lead
    {
        $phone = $normalizedFrom ?: $normalizedTo;
        if (!$phone) {
            return null;
        }

        $baseQuery = Lead::where(function ($query) use ($phone) {
            $query->where('phone', 'like', '%' . $phone)
                ->orWhere('phone_secondary', 'like', '%' . $phone);
        });

        if ($companyId) {
            return $baseQuery->where('company_id', $companyId)->first();
        }

        $candidates = $baseQuery->get(['id', 'company_id', 'client_name', 'phone', 'phone_secondary']);
        if ($candidates->isEmpty()) {
            return null;
        }

        $companyIds = $candidates->pluck('company_id')->filter()->unique();
        if ($companyIds->count() > 1) {
            Log::warning('Call webhook lead match ambiguous across companies', [
                'phone' => $phone,
                'company_ids' => $companyIds->values()->all(),
            ]);
            return null;
        }

        return $candidates->first();
    }

    private function resolveMapping(?string $normalizedFrom, ?string $normalizedTo, ?int $companyId): ?PhoneNumberMapping
    {
        if (!$normalizedFrom && !$normalizedTo) {
            return null;
        }

        if (!$companyId) {
            $candidates = PhoneNumberMapping::where(function ($query) use ($normalizedFrom, $normalizedTo) {
                $query->where('normalized_phone', $normalizedFrom)
                    ->orWhere('normalized_phone', $normalizedTo);
            })->get();

            $companyIds = $candidates->pluck('company_id')->filter()->unique();
            if ($companyIds->count() > 1) {
                Log::warning('Call webhook mapping is ambiguous across companies', [
                    'from' => $normalizedFrom,
                    'to' => $normalizedTo,
                    'company_ids' => $companyIds->values()->all(),
                ]);
                return null;
            }

            return $candidates->first();
        }

        return PhoneNumberMapping::where('company_id', $companyId)
            ->where(function ($query) use ($normalizedFrom, $normalizedTo) {
                $query->where('normalized_phone', $normalizedFrom)
                    ->orWhere('normalized_phone', $normalizedTo);
            })
            ->first();
    }

    private function getContactPhone(?string $normalizedFrom, ?string $normalizedTo): ?string
    {
        if ($normalizedFrom && $normalizedTo && $normalizedFrom !== $normalizedTo) {
            return $normalizedFrom;
        }

        return $normalizedFrom ?: $normalizedTo;
    }

    private function mapStatus(?string $status): string
    {
        $status = strtolower($status ?? 'unknown');
        $map = [
            'completed' => 'completed',
            'no-answer' => 'no-answer',
            'no_answer' => 'no-answer',
            'busy' => 'busy',
            'failed' => 'failed',
            'ringing' => 'ringing',
            'in-progress' => 'in-progress',
            'in_progress' => 'in-progress',
            'queued' => 'queued',
            'initiated' => 'initiated',
            'canceled' => 'cancelled',
            'cancelled' => 'cancelled',
        ];

        return $map[$status] ?? $status;
    }

    private function parseTimestamp(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        try {
            return now()->parse($value)->toDateTimeString();
        } catch (\Throwable $e) {
            return null;
        }
    }

    private function getFirstValue(array $payload, array $keys, $default = null)
    {
        foreach ($keys as $key) {
            if (Str::contains($key, '.')) {
                $value = data_get($payload, $key);
            } else {
                $value = $payload[$key] ?? null;
            }

            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return $default;
    }

    private function validateTwilioSignature(Request $request)
    {
        $signature = $request->header('X-Twilio-Signature');
        $authToken = config('services.telephony.twilio.auth_token');

        if (!$authToken) {
            return 'Twilio auth token not configured for signature validation';
        }

        if (!$signature) {
            return 'Twilio signature missing';
        }

        $url = $request->fullUrl();
        $params = $request->all();
        ksort($params);

        $data = $url;
        foreach ($params as $key => $value) {
            if (is_array($value)) {
                $value = implode('', $value);
            }
            $data .= $key . $value;
        }

        $expected = base64_encode(hash_hmac('sha1', $data, $authToken, true));

        if (!hash_equals($expected, $signature)) {
            return 'Invalid Twilio signature';
        }

        return true;
    }

    private function validateExotelSignature(Request $request)
    {
        $signature = $request->header('X-Exotel-Signature');
        $secret = config('services.telephony.exotel.webhook_secret');

        if (!$secret) {
            return 'Exotel webhook secret not configured for signature validation';
        }

        if (!$signature) {
            return 'Exotel signature missing';
        }

        $payload = $request->getContent();
        $expectedHex = hash_hmac('sha1', $payload, $secret);
        $expectedBase64 = base64_encode(hash_hmac('sha1', $payload, $secret, true));

        $signatureLower = strtolower(trim($signature));

        if ($signatureLower !== strtolower($expectedHex) && $signature !== $expectedBase64) {
            return 'Invalid Exotel signature';
        }

        return true;
    }
}
