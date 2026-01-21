<?php

namespace App\Modules\Calls\Infrastructure\ExternalServices;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TelephonyService
{
    public function isConfigured(): bool
    {
        $provider = config('services.telephony.provider');
        if (!$provider) {
            return false;
        }

        if ($provider === 'twilio') {
            return (bool) config('services.telephony.twilio.account_sid')
                && (bool) config('services.telephony.twilio.auth_token')
                && (bool) config('services.telephony.twilio.from_number');
        }

        if ($provider === 'exotel') {
            return (bool) config('services.telephony.exotel.account_sid')
                && (bool) config('services.telephony.exotel.token')
                && (bool) config('services.telephony.exotel.from_number')
                && (bool) config('services.telephony.exotel.subdomain');
        }

        return false;
    }

    public function getProvider(): ?string
    {
        return config('services.telephony.provider');
    }

    public function getDefaultFromNumber(): ?string
    {
        $provider = $this->getProvider();
        if ($provider === 'twilio') {
            return config('services.telephony.twilio.from_number');
        }
        if ($provider === 'exotel') {
            return config('services.telephony.exotel.from_number');
        }
        return null;
    }

    public function initiateCall(string $from, string $to, ?string $callbackUrl = null): array
    {
        $provider = $this->getProvider();
        if ($provider === 'twilio') {
            return $this->initiateTwilioCall($from, $to, $callbackUrl);
        }
        if ($provider === 'exotel') {
            return $this->initiateExotelCall($from, $to, $callbackUrl);
        }

        return [
            'success' => false,
            'message' => 'No telephony provider configured',
        ];
    }

    public function fetchRecording(string $recordingUrl, ?string $provider = null): array
    {
        $provider = $provider ?? $this->getProvider();

        try {
            if ($provider === 'twilio') {
                $sid = config('services.telephony.twilio.account_sid');
                $token = config('services.telephony.twilio.auth_token');
                $response = Http::withBasicAuth($sid, $token)->get($recordingUrl);
            } elseif ($provider === 'exotel') {
                $sid = config('services.telephony.exotel.account_sid');
                $token = config('services.telephony.exotel.token');
                $response = Http::withBasicAuth($sid, $token)->get($recordingUrl);
            } else {
                $response = Http::get($recordingUrl);
            }

            return [
                'success' => $response->successful(),
                'status' => $response->status(),
                'content_type' => $response->header('Content-Type'),
                'body' => $response->body(),
            ];
        } catch (\Throwable $e) {
            Log::error('Recording fetch failed', [
                'provider' => $provider,
                'error' => $e->getMessage(),
            ]);
            return [
                'success' => false,
                'status' => 500,
                'content_type' => 'application/json',
                'body' => null,
            ];
        }
    }

    private function initiateTwilioCall(string $from, string $to, ?string $callbackUrl = null): array
    {
        $sid = config('services.telephony.twilio.account_sid');
        $token = config('services.telephony.twilio.auth_token');
        $url = 'https://api.twilio.com/2010-04-01/Accounts/' . $sid . '/Calls.json';

        $payload = [
            'From' => $from,
            'To' => $to,
            'Url' => $callbackUrl ?: config('services.telephony.twilio.default_twiml_url'),
        ];

        if (config('services.telephony.twilio.recording_enabled')) {
            $payload['Record'] = 'true';
        }

        try {
            $response = Http::withBasicAuth($sid, $token)->asForm()->post($url, $payload);
            if ($response->successful()) {
                return [
                    'success' => true,
                    'provider' => 'twilio',
                    'provider_call_id' => $response->json('sid'),
                    'status' => $response->json('status', 'queued'),
                ];
            }
        } catch (\Throwable $e) {
            Log::error('Twilio call initiation failed', ['error' => $e->getMessage()]);
        }

        return [
            'success' => false,
            'message' => 'Twilio call initiation failed',
        ];
    }

    private function initiateExotelCall(string $from, string $to, ?string $callbackUrl = null): array
    {
        $sid = config('services.telephony.exotel.account_sid');
        $token = config('services.telephony.exotel.token');
        $subdomain = config('services.telephony.exotel.subdomain');

        $url = 'https://' . $sid . ':' . $token . '@' . $subdomain . '/v1/Accounts/' . $sid . '/Calls/connect.json';

        $payload = [
            'From' => $from,
            'To' => $to,
            'CallerId' => $from,
        ];

        if ($callbackUrl) {
            $payload['StatusCallback'] = $callbackUrl;
        }

        try {
            $response = Http::asForm()->post($url, $payload);
            if ($response->successful()) {
                $sidValue = data_get($response->json(), 'Call.Sid') ?? data_get($response->json(), 'CallSid');
                return [
                    'success' => true,
                    'provider' => 'exotel',
                    'provider_call_id' => $sidValue,
                    'status' => data_get($response->json(), 'Call.Status', 'initiated'),
                ];
            }
        } catch (\Throwable $e) {
            Log::error('Exotel call initiation failed', ['error' => $e->getMessage()]);
        }

        return [
            'success' => false,
            'message' => 'Exotel call initiation failed',
        ];
    }
}
