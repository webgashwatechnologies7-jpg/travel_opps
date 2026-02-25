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
}
