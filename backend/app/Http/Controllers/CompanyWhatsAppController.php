<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Services\WhatsAppAutoProvisioningService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CompanyWhatsAppController extends Controller
{
    protected $whatsappProvisioning;

    public function __construct(WhatsAppAutoProvisioningService $whatsappProvisioning)
    {
        $this->whatsappProvisioning = $whatsappProvisioning;
    }

    /**
     * Auto-provision WhatsApp for company
     */
    public function autoProvision(Request $request): JsonResponse
    {
        try {
            $company = auth()->user()->company;
            
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found'
                ], 404);
            }

            // Check if WhatsApp is already configured
            if ($company->whatsapp_enabled && $company->whatsapp_status === 'active') {
                return response()->json([
                    'success' => false,
                    'message' => 'WhatsApp is already configured for this company'
                ], 400);
            }

            // Start auto-provisioning
            $result = $this->whatsappProvisioning->provisionForCompany($company);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp auto-provisioned successfully',
                    'data' => [
                        'phone_number' => $result['phone_number'],
                        'webhook_url' => $result['webhook_url'],
                        'status' => 'active'
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to auto-provision WhatsApp',
                    'error' => $result['error']
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('WhatsApp auto-provisioning error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'company_id' => auth()->user()?->company_id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Auto-provisioning failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get WhatsApp settings for company
     */
    public function getSettings(Request $request): JsonResponse
    {
        try {
            $company = auth()->user()->company;
            
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found'
                ], 404);
            }

            $status = $this->whatsappProvisioning->checkProvisioningStatus($company);
            $appSecret = $company->whatsapp_settings['app_secret'] ?? null;

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp settings retrieved successfully',
                'data' => array_merge($status, [
                    'company_id' => $company->id,
                    'company_name' => $company->name,
                    'phone_number' => $company->whatsapp_phone_number,
                    'display_name' => $company->whatsapp_display_name,
                    'whatsapp_phone_number' => $company->whatsapp_phone_number,
                    'whatsapp_phone_number_id' => $company->whatsapp_phone_number_id,
                    'whatsapp_api_key' => $company->whatsapp_api_key,
                    'whatsapp_business_account_id' => $company->whatsapp_business_account_id,
                    'whatsapp_verify_token' => $company->whatsapp_verify_token,
                    'whatsapp_webhook_secret' => $company->whatsapp_webhook_secret,
                    'whatsapp_app_secret' => $appSecret,
                ])
            ]);

        } catch (\Exception $e) {
            Log::error('Get WhatsApp settings error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve settings',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Update WhatsApp settings manually
     */
    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $validator = validator($request->all(), [
                'whatsapp_phone_number' => 'nullable|string|max:20',
                'whatsapp_display_name' => 'nullable|string|max:100',
                'whatsapp_api_key' => 'nullable|string|max:2000',
                'whatsapp_phone_number_id' => 'nullable|string|max:100',
                'whatsapp_webhook_secret' => 'nullable|string|max:255',
                'whatsapp_verify_token' => 'nullable|string|max:100',
                'whatsapp_business_account_id' => 'nullable|string|max:150',
                'whatsapp_app_secret' => 'nullable|string|max:255',
                'whatsapp_enabled' => 'nullable|boolean',
                'auto_provision_whatsapp' => 'nullable|boolean'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $company = auth()->user()->company;
            
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found'
                ], 404);
            }

            $updateData = $request->only([
                'whatsapp_phone_number',
                'whatsapp_display_name',
                'whatsapp_api_key',
                'whatsapp_phone_number_id',
                'whatsapp_webhook_secret',
                'whatsapp_verify_token',
                'whatsapp_business_account_id',
                'whatsapp_enabled',
                'auto_provision_whatsapp'
            ]);

            if ($request->filled('whatsapp_api_key') && $request->filled('whatsapp_phone_number_id')) {
                $updateData['whatsapp_enabled'] = true;
                $updateData['whatsapp_status'] = 'active';
            }

            $company->update($updateData);

            if ($request->filled('whatsapp_app_secret')) {
                $settings = $company->whatsapp_settings ?? [];
                $settings['app_secret'] = $request->input('whatsapp_app_secret');
                $company->update(['whatsapp_settings' => $settings]);
            }

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp settings updated successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Update WhatsApp settings error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Sync WhatsApp settings
     */
    public function syncSettings(Request $request): JsonResponse
    {
        try {
            $company = auth()->user()->company;
            
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found'
                ], 404);
            }

            $result = $this->whatsappProvisioning->syncSettings($company);

            if ($result['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp settings synced successfully',
                    'data' => [
                        'status' => $result['status'],
                        'synced_at' => now()
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to sync settings',
                    'error' => $result['error']
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Sync WhatsApp settings error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Sync failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Test WhatsApp connection
     */
    public function testConnection(Request $request): JsonResponse
    {
        try {
            $company = auth()->user()->company;
            
            if (!$company || !$company->whatsapp_enabled) {
                return response()->json([
                    'success' => false,
                    'message' => 'WhatsApp not configured for this company'
                ], 400);
            }

            $api = app(\App\Services\WhatsAppService::class)->setCompanyConfig($company);
            $testNumber = preg_replace('/\D/', '', $company->whatsapp_phone_number ?? '');
            if (strlen($testNumber) === 10 && preg_match('/^[6-9]/', $testNumber)) {
                $testNumber = '91' . $testNumber;
            }
            $testResult = $api->sendMessage(
                $testNumber ?: '0',
                'Test message from CRM - WhatsApp integration is working!',
                null,
                []
            );

            if ($testResult['success']) {
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp connection test successful',
                    'data' => [
                        'test_message_id' => $testResult['message_id'],
                        'tested_at' => now()
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'WhatsApp connection test failed',
                    'error' => $testResult['error']
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('WhatsApp connection test error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Connection test failed',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get WhatsApp analytics
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        try {
            $company = auth()->user()->company;
            
            if (!$company) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company not found'
                ], 404);
            }

            $analytics = \DB::table('whatsapp_messages')
                ->where('company_id', $company->id)
                ->where('created_at', '>=', now()->subDays(30))
                ->selectRaw('
                    COUNT(*) as total_messages,
                    SUM(CASE WHEN direction = "outbound" THEN 1 ELSE 0 END) as sent_messages,
                    SUM(CASE WHEN direction = "inbound" THEN 1 ELSE 0 END) as received_messages,
                    SUM(CASE WHEN status = "read" THEN 1 ELSE 0 END) as read_messages,
                    SUM(CASE WHEN is_template = 1 THEN 1 ELSE 0 END) as template_messages,
                    DATE(created_at) as date,
                    HOUR(created_at) as hour
                ')
                ->groupBy('date')
                ->orderBy('date', 'desc')
                ->limit(30)
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp analytics retrieved successfully',
                'data' => [
                    'analytics' => $analytics,
                    'summary' => [
                        'total_messages' => $analytics->sum('total_messages'),
                        'sent_messages' => $analytics->sum('sent_messages'),
                        'received_messages' => $analytics->sum('received_messages'),
                        'read_messages' => $analytics->sum('read_messages'),
                        'read_rate' => $analytics->sum('sent_messages') > 0 
                            ? round(($analytics->sum('read_messages') / $analytics->sum('sent_messages')) * 100, 2)
                            : 0
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('WhatsApp analytics error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve analytics',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
