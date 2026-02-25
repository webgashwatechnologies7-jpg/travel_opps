<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UltramsgService
{
    private $instanceId;
    private $token;
    private $baseUrl;

    public function __construct()
    {
        $this->baseUrl = 'https://api.ultramsg.com/';
    }

    /**
     * Use company-specific WhatsApp config (for multi-tenant).
     */
    public function setCompanyConfig($company): self
    {
        if ($company) {
            // Hum frontend se aane wale available fields ko use karenge
            // Phone Number ID box me: Instance ID dalni h
            // API Key box me: Ultramsg Token dalna h
            $this->instanceId = $company->whatsapp_phone_number_id ?? null;
            $this->token = $company->whatsapp_api_key ?? null;
        }
        return $this;
    }

    /**
     * Send WhatsApp text message via Ultramsg
     */
    public function sendMessage($to, $message, $templateName = null, $templateData = [])
    {
        try {
            if (!$this->instanceId || !$this->token) {
                return [
                    'success' => false,
                    'error' => 'Ultramsg credentials not configured',
                    'status' => 'failed'
                ];
            }

            // Ultramsg expects country code without +
            $to = ltrim($to, '+');

            $payload = [
                'token' => $this->token,
                'to' => $to,
                'body' => $message
            ];

            $response = Http::asForm()->post($this->baseUrl . $this->instanceId . '/messages/chat', $payload);

            if ($response->successful() && isset($response->json()['sent']) && $response->json()['sent'] == 'true') {
                Log::info('Ultramsg message sent', [
                    'to' => $to,
                    'message_id' => $response->json()['id'] ?? null,
                    'user_id' => auth()->id(),
                    'company_id' => auth()->user()?->company_id
                ]);

                return [
                    'success' => true,
                    'message_id' => $response->json()['id'] ?? null,
                    'status' => 'sent'
                ];
            } else {
                Log::error('Ultramsg message failed', [
                    'to' => $to,
                    'error' => $response->json(),
                    'status' => $response->status()
                ]);

                return [
                    'success' => false,
                    'error' => $response->json('error', 'Failed to send message'),
                    'status' => 'failed'
                ];
            }
        } catch (\Exception $e) {
            Log::error('Ultramsg service error', [
                'error' => $e->getMessage(),
                'to' => $to,
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => 'Service temporarily unavailable',
                'status' => 'failed'
            ];
        }
    }

    /**
     * Test Ultramsg connection
     */
    public function testConnection()
    {
        if (!$this->instanceId || !$this->token) {
            return false;
        }

        try {
            $response = Http::get($this->baseUrl . $this->instanceId . '/instance/status', [
                'token' => $this->token
            ]);

            return $response->successful() && $response->json('status.accountStatus') === 'authenticated';
        } catch (\Exception $e) {
            return false;
        }
    }

    public function uploadMedia($filePath, $type)
    {
        // Ultramsg can directly send via base64, so we just return the local file path as "url" to process it in sendMedia later.
        if (!file_exists($filePath)) {
            return ['success' => false, 'error' => 'File not found'];
        }
        return ['success' => true, 'url' => $filePath]; // Return raw file path so sendMedia can use base64
    }

    public function sendMedia($to, $urlOrPath, $type, $caption = '')
    {
        try {
            if (!$this->instanceId || !$this->token) {
                return ['success' => false, 'error' => 'Ultramsg credentials not configured'];
            }

            $endpoint = $type == 'image' ? 'image' : 'document';
            $to = ltrim($to, '+');

            $payload = [
                'token' => $this->token,
                'to' => $to,
            ];

            if ($caption) {
                $payload['caption'] = $caption;
            }

            if (file_exists($urlOrPath)) {
                $fileContent = base64_encode(file_get_contents($urlOrPath));
                $mime = mime_content_type($urlOrPath);
                $b64Url = "data:$mime;base64,$fileContent";

                if ($endpoint == 'document') {
                    $payload['document'] = $b64Url;
                    $payload['filename'] = basename($urlOrPath);
                } else {
                    $payload['image'] = $b64Url;
                }
            } else {
                // If it's an actual URL
                if ($endpoint == 'document') {
                    $payload['document'] = $urlOrPath;
                    $payload['filename'] = basename($urlOrPath) ?: 'document';
                } else {
                    $payload['image'] = $urlOrPath;
                }
            }

            $response = Http::asForm()->post($this->baseUrl . $this->instanceId . '/messages/' . $endpoint, $payload);

            return [
                'success' => $response->successful() && isset($response->json()['sent']) && $response->json()['sent'] == 'true',
                'error' => $response->json('error', '')
            ];
        } catch (\Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    public function verifyWebhook($payload, $signature)
    {
        // Ultramsg does not use complex payload signatures like Meta. 
        // We can just return true.
        return true;
    }
}
