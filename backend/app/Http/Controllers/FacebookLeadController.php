<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\Company;
use App\Models\User;
use App\Notifications\GenericNotification;

class FacebookLeadController extends Controller
{
    /**
     * Webhook verification for Facebook (GET)
     * Meta sends a GET request with hub.verify_token to check your server.
     */
    public function verify(Request $request)
    {
        // Token you set in Meta Developer Dashboard
        $verifyToken = config('services.facebook.webhook_verify_token', 'my_crm_lead_token');
        
        if ($request->input('hub_mode') === 'subscribe' && 
            $request->input('hub_verify_token') === $verifyToken) {
            Log::info('Facebook Webhook verified successfully.');
            return response($request->input('hub_challenge'));
        }

        Log::warning('Facebook Webhook verification failed.');
        return response('Invalid verification token', 403);
    }

    /**
     * Actual lead notification (POST)
     * When a lead is generated, Meta sends a POST request with leadgen_id.
     */
    public function handleWebhook(Request $request)
    {
        $payload = $request->all();
        Log::info('Facebook Webhook Payload Received:', $payload);

        if (isset($payload['entry'])) {
            foreach ($payload['entry'] as $entry) {
                if (isset($entry['changes'])) {
                    foreach ($entry['changes'] as $change) {
                        if ($change['field'] === 'leadgen') {
                            $leadgenId = $change['value']['leadgen_id'];
                            $pageId = $change['value']['page_id'];
                            
                            $this->processLead($leadgenId, $pageId);
                        }
                    }
                }
            }
        }

        return response('OK', 200);
    }

    /**
     * Fetch lead details and save to CRM
     */
    protected function processLead($leadgenId, $pageId)
    {
        // 1. Find company by Facebook Page ID
        $company = Company::where('fb_page_id', $pageId)->first();
        
        // If not found, log error (we can't assign to a company)
        if (!$company) {
            Log::error("Company mapping missing for Facebook Page ID: $pageId");
            return;
        }

        // 2. Fetch lead details from Facebook Graph API
        $accessToken = $company->fb_page_access_token;

        if (!$accessToken) {
            Log::error("Facebook Access Token missing for Company: {$company->name} (Page ID: $pageId)");
            return;
        }

        // Call Facebook Graph API
        $response = Http::get("https://graph.facebook.com/v19.0/{$leadgenId}", [
            'access_token' => $accessToken
        ]);

        if ($response->successful()) {
            $fbLeadData = $response->json();
            $this->storeLeadInCrm($fbLeadData, $company);
        } else {
            Log::error("Failed to fetch lead details from Facebook Graph API for lead ID $leadgenId: " . $response->body());
        }
    }

    /**
     * Map FB data to CRM Lead and Notify
     */
    protected function storeLeadInCrm($fbLead, $company)
    {
        $fieldData = [];
        if (isset($fbLead['field_data'])) {
            foreach ($fbLead['field_data'] as $field) {
                $fieldData[$field['name']] = $field['values'][0] ?? null;
            }
        }

        // Extract basic info
        $name = $fieldData['full_name'] ?? (($fieldData['first_name'] ?? 'FB Lead') . ' ' . ($fieldData['last_name'] ?? ''));
        $email = $fieldData['email'] ?? null;
        $phone = $fieldData['phone_number'] ?? ($fieldData['phone'] ?? null);
        $destination = $fieldData['destination'] ?? 'Not Specified';

        Log::info("Extracted FB Lead Data:", [
            'name' => $name,
            'email' => $email,
            'phone' => $phone,
            'destination' => $destination
        ]);

        // Find default user to assign (usually admin)
        $assignedUser = User::where('company_id', $company->id)
            ->where('is_active', 1)
            ->orderBy('id', 'asc')
            ->first();

        if (!$assignedUser) {
            Log::error("No active user found to assign FB lead in company: {$company->id}");
            return;
        }

        // Collect all data for remark
        $allFieldsString = "";
        foreach ($fieldData as $key => $val) {
            $allFieldsString .= "\n" . ucfirst(str_replace('_', ' ', $key)) . ": " . $val;
        }

        // Create the lead
        $lead = Lead::create([
            'company_id' => $company->id,
            'client_name' => trim($name),
            'phone' => $phone,
            'email' => $email,
            'destination' => $destination,
            'source' => 'Facebook Ads',
            'status' => 'new',
            'remark' => 'Automatically imported from Facebook Lead Ads. Form ID: ' . ($fbLead['form_id'] ?? 'N/A') . $allFieldsString,
            'assigned_to' => $assignedUser->id,
            'created_by' => $assignedUser->id,
            'client_type' => 'B2C',
        ]);

        // Send Bell Notification
        try {
            $assignedUser->notify(new GenericNotification([
                'type' => 'lead',
                'title' => 'New Facebook Lead',
                'message' => 'New lead from Meta: ' . $name . ' (' . $destination . ')',
                'action_url' => '/leads/' . $lead->id,
            ]));
        } catch (\Exception $e) {
            Log::error('Notification failed for Facebook lead: ' . $e->getMessage());
        }

        Log::info("Facebook lead processed and saved. Lead ID: " . $lead->id);
    }

    /**
     * Get Ads Performance Insights for Dashboard
     */
    public function getAdsInsights(Request $request)
    {
        $user = auth()->user();
        if (!$user->company_id) return response()->json(['success' => false, 'message' => 'No company found'], 404);

        $company = Company::find($user->company_id);
        $accessToken = $company->fb_page_access_token;
        $pageId = $company->fb_page_id;
        $adAccountId = $company->fb_ad_account_id;

        if (!$accessToken || !$pageId) {
            return response()->json([
                'success' => false, 
                'message' => 'Meta integration not fully configured. Please check settings.'
            ], 400);
        }

        try {
            $range = $request->get('range', 'last_30d');
            
            // Default stats (will be updated if Ad Account ID exists)
            $spent = 0;
            $impressions = 0;
            $clicks = 0;
            $leadsCount = Lead::where('company_id', $company->id)->where('source', 'Facebook Ads')->count();

            if ($adAccountId) {
                // Call Facebook Ads Insights API
                // Usually Ad Account ID needs to be prefixed with 'act_' if not already
                $formattedId = str_starts_with($adAccountId, 'act_') ? $adAccountId : 'act_' . $adAccountId;
                
                $response = Http::get("https://graph.facebook.com/v19.0/{$formattedId}/insights", [
                    'access_token' => $accessToken,
                    'date_preset' => $range,
                    'fields' => 'spend,impressions,inline_link_clicks'
                ]);

                if ($response->successful()) {
                    $insights = $response->json()['data'][0] ?? [];
                    $spent = (float) ($insights['spend'] ?? 0);
                    $impressions = (int) ($insights['impressions'] ?? 0);
                    $clicks = (int) ($insights['inline_link_clicks'] ?? 0);
                }
            }

            // Monthly leads data for current year
            $monthlyLeads = Lead::where('company_id', $company->id)
                ->where('source', 'Facebook Ads')
                ->whereYear('created_at', now()->year)
                ->selectRaw('MONTH(created_at) as month, COUNT(*) as count')
                ->groupBy('month')
                ->orderBy('month')
                ->get()
                ->mapWithKeys(fn($item) => [$item->month => $item->count])
                ->all();

            $chartData = [];
            $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            foreach ($months as $index => $name) {
                $chartData[] = [
                    'name' => $name,
                    'leads' => $monthlyLeads[$index + 1] ?? 0
                ];
            }
            
            $cpl = $leadsCount > 0 ? round($spent / $leadsCount, 2) : 0;
            $cpc = $clicks > 0 ? round($spent / $clicks, 2) : 0;

            return response()->json([
                'success' => true,
                'data' => [
                    'platform' => 'Meta (Facebook)',
                    'spent' => $spent,
                    'impressions' => $impressions,
                    'clicks' => $clicks,
                    'leads' => $leadsCount,
                    'cpc' => $cpc,
                    'cpl' => $cpl,
                    'chart_data' => $chartData,
                    'recent_leads' => Lead::where('company_id', $company->id)
                        ->where('source', 'Facebook Ads')
                        ->orderBy('created_at', 'desc')
                        ->limit(5)
                        ->get()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
