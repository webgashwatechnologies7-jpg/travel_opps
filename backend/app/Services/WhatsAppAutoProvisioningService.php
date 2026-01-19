<?php

namespace App\Services;

use App\Models\Company;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class WhatsAppAutoProvisioningService
{
    private $masterApiKey;
    private $baseUrl;

    public function __construct()
    {
        $this->masterApiKey = config('services.whatsapp.master_api_key');
        $this->baseUrl = config('services.whatsapp.base_url', 'https://graph.facebook.com/v18.0');
    }

    /**
     * Auto-provision WhatsApp for new company
     */
    public function provisionForCompany(Company $company): array
    {
        try {
            Log::info('Starting WhatsApp auto-provisioning', [
                'company_id' => $company->id,
                'company_name' => $company->name
            ]);

            // Step 1: Create WhatsApp Business Account for company
            $wabaResult = $this->createBusinessAccount($company);
            
            if (!$wabaResult['success']) {
                return $this->updateCompanyStatus($company, 'error', $wabaResult['error']);
            }

            // Step 2: Register phone number for company
            $phoneResult = $this->registerPhoneNumber($company, $wabaResult['waba_id']);
            
            if (!$phoneResult['success']) {
                return $this->updateCompanyStatus($company, 'error', $phoneResult['error']);
            }

            // Step 3: Generate webhook endpoints
            $webhookResult = $this->setupWebhooks($company);
            
            if (!$webhookResult['success']) {
                return $this->updateCompanyStatus($company, 'error', $webhookResult['error']);
            }

            // Step 4: Update company with WhatsApp settings
            $this->updateCompanyWhatsAppSettings($company, [
                'whatsapp_phone_number' => $phoneResult['phone_number'],
                'whatsapp_api_key' => $phoneResult['api_key'],
                'whatsapp_phone_number_id' => $phoneResult['phone_number_id'],
                'whatsapp_webhook_secret' => $webhookResult['webhook_secret'],
                'whatsapp_verify_token' => $webhookResult['verify_token'],
                'whatsapp_business_account_id' => $wabaResult['business_account_id'],
                'whatsapp_waba_id' => $wabaResult['waba_id'],
                'whatsapp_display_name' => $company->name,
                'whatsapp_status' => 'active',
                'whatsapp_enabled' => true,
                'whatsapp_last_sync' => now()
            ]);

            Log::info('WhatsApp auto-provisioning completed', [
                'company_id' => $company->id,
                'phone_number' => $phoneResult['phone_number']
            ]);

            return [
                'success' => true,
                'message' => 'WhatsApp auto-provisioned successfully',
                'phone_number' => $phoneResult['phone_number'],
                'webhook_url' => $webhookResult['webhook_url']
            ];

        } catch (\Exception $e) {
            Log::error('WhatsApp auto-provisioning failed', [
                'company_id' => $company->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return $this->updateCompanyStatus($company, 'error', $e->getMessage());
        }
    }

    /**
     * Create WhatsApp Business Account
     */
    private function createBusinessAccount(Company $company): array
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->masterApiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/whatsapp_business_accounts', [
                'name' => $company->name . ' WhatsApp',
                'timezone' => 'Asia/Kolkata',
                'currency' => 'INR',
                'message_template_namespace' => 'whatsapp:' . Str::slug($company->name) . '_templates'
            ]);

            if ($response->successful()) {
                $data = $response->json();
                return [
                    'success' => true,
                    'business_account_id' => $data['id'],
                    'waba_id' => $data['id'],
                    'name' => $data['name']
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('error.message', 'Failed to create business account')
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Business account creation failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Register phone number for WhatsApp
     */
    private function registerPhoneNumber(Company $company, string $wabaId): array
    {
        try {
            // Generate a virtual phone number for the company
            $phoneNumber = $this->generateVirtualPhoneNumber($company);
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->masterApiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/' . $wabaId . '/phone_numbers', [
                'display_phone_number' => $phoneNumber,
                'verified_name' => $company->name,
                'code_verification_method' => 'SMS',
                'callback_url' => route('whatsapp.verification.callback', ['company' => $company->id])
            ]);

            if ($response->successful()) {
                $data = $response->json();
                
                return [
                    'success' => true,
                    'phone_number' => $data['display_phone_number'],
                    'phone_number_id' => $data['id'],
                    'api_key' => $this->generateCompanyApiKey($company),
                    'status' => $data['verification_status'] ?? 'pending'
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('error.message', 'Failed to register phone number')
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Phone number registration failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Setup webhooks for company
     */
    private function setupWebhooks(Company $company): array
    {
        try {
            $webhookSecret = Str::random(32);
            $verifyToken = Str::random(16);
            
            $webhookUrl = route('webhook.company.whatsapp', ['company' => $company->id]);
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->masterApiKey,
                'Content-Type' => 'application/json',
            ])->post($this->baseUrl . '/webhooks', [
                'url' => $webhookUrl,
                'verify_token' => $verifyToken,
                'secret' => $webhookSecret,
                'fields' => ['messages', 'message_status'],
                'enabled' => true
            ]);

            if ($response->successful()) {
                return [
                    'success' => true,
                    'webhook_url' => $webhookUrl,
                    'webhook_secret' => $webhookSecret,
                    'verify_token' => $verifyToken
                ];
            }

            return [
                'success' => false,
                'error' => $response->json('error.message', 'Failed to setup webhooks')
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Webhook setup failed: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Generate virtual phone number for company
     */
    private function generateVirtualPhoneNumber(Company $company): string
    {
        // Generate a virtual number based on company subdomain
        $subdomain = Str::slug($company->name);
        $randomDigits = rand(1000, 9999);
        
        // For demo purposes, return a formatted number
        // In production, this would integrate with a phone number provider
        return '+91' . $randomDigits; // Indian number format
    }

    /**
     * Generate API key for company
     */
    private function generateCompanyApiKey(Company $company): string
    {
        // Generate a unique API key for the company
        return 'wa_' . Str::random(32) . '_' . $company->id;
    }

    /**
     * Update company WhatsApp status
     */
    private function updateCompanyStatus(Company $company, string $status, string $error = null): array
    {
        $company->update([
            'whatsapp_status' => $status,
            'whatsapp_last_sync' => now()
        ]);

        if ($error) {
            Log::error('WhatsApp status updated with error', [
                'company_id' => $company->id,
                'status' => $status,
                'error' => $error
            ]);
        }

        return [
            'success' => false,
            'error' => $error ?? "WhatsApp setup failed with status: {$status}"
        ];
    }

    /**
     * Update company WhatsApp settings
     */
    private function updateCompanyWhatsAppSettings(Company $company, array $settings): void
    {
        $company->update($settings);
        
        Log::info('Company WhatsApp settings updated', [
            'company_id' => $company->id,
            'settings' => array_keys($settings)
        ]);
    }

    /**
     * Check WhatsApp provisioning status
     */
    public function checkProvisioningStatus(Company $company): array
    {
        return [
            'status' => $company->whatsapp_status,
            'enabled' => $company->whatsapp_enabled,
            'phone_number' => $company->whatsapp_phone_number,
            'last_sync' => $company->whatsapp_last_sync,
            'display_name' => $company->whatsapp_display_name
        ];
    }

    /**
     * Sync WhatsApp settings
     */
    public function syncSettings(Company $company): array
    {
        try {
            if (!$company->whatsapp_enabled || !$company->whatsapp_api_key) {
                return [
                    'success' => false,
                    'error' => 'WhatsApp not enabled for this company'
                ];
            }

            // Sync current status with Meta
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $company->whatsapp_api_key,
            ])->get($this->baseUrl . '/' . $company->whatsapp_phone_number_id);

            if ($response->successful()) {
                $data = $response->json();
                
                $company->update([
                    'whatsapp_status' => $data['display_phone_number_status'] ?? 'active',
                    'whatsapp_last_sync' => now()
                ]);

                return [
                    'success' => true,
                    'message' => 'Settings synced successfully',
                    'status' => $data['display_phone_number_status']
                ];
            }

            return [
                'success' => false,
                'error' => 'Failed to sync settings'
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'error' => 'Sync failed: ' . $e->getMessage()
            ];
        }
    }
}
