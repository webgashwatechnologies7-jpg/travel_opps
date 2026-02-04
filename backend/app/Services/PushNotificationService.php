<?php

namespace App\Services;

use App\Models\PushToken;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    /**
     * Send push notification to one or more users by ID.
     * Returns true if at least one send succeeded; logs and ignores per-token failures.
     */
    public static function sendToUsers(array $userIds, string $title, string $body, array $data = []): bool
    {
        if (empty($userIds)) {
            return false;
        }

        $tokens = PushToken::whereIn('user_id', $userIds)
            ->pluck('token')
            ->unique()
            ->values()
            ->all();

        if (empty($tokens)) {
            Log::info('PushNotificationService: No push tokens for user IDs', ['user_ids' => $userIds]);
            return false;
        }

        return self::sendToTokens($tokens, $title, $body, $data);
    }

    /**
     * Send push to FCM tokens. Returns true if at least one send succeeded.
     */
    public static function sendToTokens(array $tokens, string $title, string $body, array $data = []): bool
    {
        if (empty($tokens)) {
            return false;
        }

        $data = array_map('strval', $data);
        $projectId = config('services.fcm.project_id');
        $serviceAccountPath = config('services.fcm.service_account_json_path');
        $serverKey = config('services.fcm.server_key');

        if ($projectId && $serviceAccountPath && is_file($serviceAccountPath)) {
            try {
                self::sendFcmV1($projectId, $serviceAccountPath, $tokens, $title, $body, $data);
                return true;
            } catch (\Throwable $e) {
                Log::error('PushNotificationService FCM v1 error', ['error' => $e->getMessage()]);
                return false;
            }
        }

        if ($serverKey) {
            $payload = [
                'notification' => ['title' => $title, 'body' => $body],
                'data' => $data,
            ];
            if (count($tokens) === 1) {
                $payload['to'] = $tokens[0];
            } else {
                $payload['registration_ids'] = $tokens;
            }
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $serverKey,
                'Content-Type' => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', $payload);
            if ($response->successful()) {
                return true;
            }
            Log::warning('PushNotificationService legacy FCM failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
        }

        return false;
    }

    private static function sendFcmV1(
        string $projectId,
        string $serviceAccountPath,
        array $tokens,
        string $title,
        string $body,
        array $data
    ): void {
        $client = new \Google_Client();
        $client->setAuthConfig($serviceAccountPath);
        $client->addScope('https://www.googleapis.com/auth/firebase.messaging');
        $client->fetchAccessTokenWithAssertion();
        $accessToken = $client->getAccessToken();
        if (empty($accessToken['access_token'])) {
            throw new \RuntimeException('Failed to get FCM access token');
        }
        $url = 'https://fcm.googleapis.com/v1/projects/' . $projectId . '/messages:send';
        $headers = [
            'Authorization' => 'Bearer ' . $accessToken['access_token'],
            'Content-Type' => 'application/json',
        ];
        foreach ($tokens as $token) {
            $bodyPayload = [
                'message' => [
                    'token' => $token,
                    'notification' => ['title' => $title, 'body' => $body],
                    'data' => $data,
                ],
            ];
            $response = Http::withHeaders($headers)->post($url, $bodyPayload);
            if (!$response->successful()) {
                Log::warning('FCM v1 single token failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        }
    }
}
