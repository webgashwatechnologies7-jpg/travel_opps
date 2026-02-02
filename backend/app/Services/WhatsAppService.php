<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;

class WhatsAppService
{
    private $apiKey;
    private $baseUrl;
    private $phoneNumberId;

    public function __construct()
    {
        $this->apiKey = config('services.whatsapp.api_key');
        $this->baseUrl = config('services.whatsapp.base_url', 'https://graph.facebook.com/v18.0');
        $this->phoneNumberId = config('services.whatsapp.phone_number_id');
    }

    /**
     * Use company-specific WhatsApp config (for multi-tenant).
     */
    public function setCompanyConfig($company): self
    {
        if ($company) {
            $this->apiKey = $company->whatsapp_api_key ?? $this->apiKey;
            $this->phoneNumberId = $company->whatsapp_phone_number_id ?? $this->phoneNumberId;
        }
        return $this;
    }

    /**
     * Send WhatsApp message
     */
    public function sendMessage($to, $message, $templateName = null, $templateData = [])
    {
        try {
            $payload = $this->buildMessagePayload($to, $message, $templateName, $templateData);
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/' . $this->phoneNumberId . '/messages', $payload);

            if ($response->successful()) {
                Log::info('WhatsApp message sent', [
                    'to' => $to,
                    'message_id' => $response->json('messages.0.id'),
                    'user_id' => auth()->id(),
                    'company_id' => auth()->user()?->company_id
                ]);
                
                return [
                    'success' => true,
                    'message_id' => $response->json('messages.0.id'),
                    'status' => 'sent'
                ];
            } else {
                Log::error('WhatsApp message failed', [
                    'to' => $to,
                    'error' => $response->json(),
                    'status' => $response->status()
                ]);
                
                return [
                    'success' => false,
                    'error' => $response->json('error.message', 'Failed to send message'),
                    'status' => 'failed'
                ];
            }
        } catch (\Exception $e) {
            Log::error('WhatsApp service error', [
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
     * Send media message (image, document, etc.)
     */
    public function sendMedia($to, $mediaUrl, $mediaType, $caption = '')
    {
        try {
            $payload = [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => $mediaType,
                $mediaType => [
                    'link' => $mediaUrl,
                    'caption' => $caption
                ]
            ];

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/' . $this->phoneNumberId . '/messages', $payload);

            return $this->handleResponse($response);
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Upload media to WhatsApp servers
     */
    public function uploadMedia($filePath, $mediaType)
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
            ])->attach(
                'file',
                file_get_contents($filePath),
                basename($filePath),
                ['Content-Type' => $this->getMimeType($mediaType)]
            )->post($this->baseUrl . '/' . $this->phoneNumberId . '/media');

            if ($response->successful()) {
                return [
                    'success' => true,
                    'media_id' => $response->json('id'),
                    'url' => $response->json('url')
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('error.message', 'Upload failed')
            ];
        } catch (\Exception $e) {
            return $this->handleException($e);
        }
    }

    /**
     * Build message payload
     */
    private function buildMessagePayload($to, $message, $templateName = null, $templateData = [])
    {
        if ($templateName) {
            // Template message
            return [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'template',
                'template' => [
                    'name' => $templateName,
                    'language' => [
                        'code' => 'en'
                    ],
                    'components' => $this->buildTemplateComponents($templateData)
                ]
            ];
        } else {
            // Text message
            return [
                'messaging_product' => 'whatsapp',
                'to' => $to,
                'type' => 'text',
                'text' => [
                    'body' => $message,
                    'preview_url' => false
                ]
            ];
        }
    }

    /**
     * Build template components
     */
    private function buildTemplateComponents($templateData)
    {
        $components = [];
        
        if (isset($templateData['body'])) {
            $components[] = [
                'type' => 'body',
                'parameters' => array_map(function ($param) {
                    return ['type' => 'text', 'text' => $param];
                }, $templateData['body'])
            ];
        }

        return $components;
    }

    /**
     * Handle API response
     */
    private function handleResponse($response)
    {
        if ($response->successful()) {
            return [
                'success' => true,
                'message_id' => $response->json('messages.0.id'),
                'status' => 'sent'
            ];
        }

        return [
            'success' => false,
            'error' => $response->json('error.message', 'Request failed'),
            'status' => 'failed'
        ];
    }

    /**
     * Handle exceptions
     */
    private function handleException($e)
    {
        Log::error('WhatsApp service exception', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        return [
            'success' => false,
            'error' => 'Service temporarily unavailable',
            'status' => 'failed'
        ];
    }

    /**
     * Get MIME type for media
     */
    private function getMimeType($mediaType)
    {
        $mimeTypes = [
            'image' => 'image/jpeg',
            'document' => 'application/pdf',
            'audio' => 'audio/mpeg',
            'video' => 'video/mp4'
        ];

        return $mimeTypes[$mediaType] ?? 'application/octet-stream';
    }

    /**
     * Verify webhook signature
     */
    public function verifyWebhook($payload, $signature)
    {
        $webhookSecret = config('services.whatsapp.webhook_secret');
        $expectedSignature = hash_hmac('sha256', $payload, $webhookSecret);
        
        return hash_equals($expectedSignature, $signature);
    }
}
