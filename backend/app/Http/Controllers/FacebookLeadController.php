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
        $name = $fieldData['full_name'] ?? ($fieldData['first_name'] ?? 'FB Lead') . ' ' . ($fieldData['last_name'] ?? '');
        $email = $fieldData['email'] ?? null;
        $phone = $fieldData['phone_number'] ?? null;
        $destination = $fieldData['destination'] ?? 'Not Specified';

        // Find default user to assign (usually admin)
        $assignedUser = User::where('company_id', $company->id)
            ->where('is_active', 1)
            ->orderBy('id', 'asc')
            ->first();

        if (!$assignedUser) {
            Log::error("No active user found to assign FB lead in company: {$company->id}");
            return;
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
            'remark' => 'Automatically imported from Facebook Lead Ads. Form ID: ' . ($fbLead['form_id'] ?? 'N/A'),
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
}
