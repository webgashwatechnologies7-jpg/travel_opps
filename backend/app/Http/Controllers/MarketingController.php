<?php

namespace App\Http\Controllers;

use App\Models\ClientGroup;
use App\Models\EmailCampaign;
use App\Models\SmsCampaign;
use App\Models\MarketingTemplate;
use App\Models\LandingPage;
use App\Services\LandingPageTemplateService;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\User;
use App\Models\Setting;
use App\Services\CompanyMailSettingsService;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class MarketingController extends Controller
{
    /**
     * Get marketing dashboard stats
     */
    public function dashboard(): JsonResponse
    {
        try {
            $stats = [
                'total_campaigns' => EmailCampaign::count() + SmsCampaign::count() + \App\Models\WhatsAppCampaign::count(),
                'active_campaigns' => EmailCampaign::active()->count() +
                    SmsCampaign::active()->count() +
                    \App\Models\WhatsAppCampaign::active()->count(),
                'total_sent' => EmailCampaign::sum('sent_count') +
                    SmsCampaign::sum('sent_count') +
                    \App\Models\WhatsAppCampaign::sum('sent_count'),
                'total_opens' => EmailCampaign::sum('open_count'),
                'total_clicks' => EmailCampaign::sum('click_count'),
                'conversion_rate' => $this->calculateConversionRate(),
                'recent_campaigns' => $this->getRecentCampaigns(),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Marketing dashboard stats retrieved successfully',
                'data' => $stats,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Marketing Dashboard Error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'company_id' => auth()->user()?->company_id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve marketing stats',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                'code' => 'DASHBOARD_ERROR'
            ], 500);
        }
    }

    /**
     * Get all email campaigns
     */
    public function emailCampaigns(): JsonResponse
    {
        try {
            $campaigns = EmailCampaign::with(['template', 'leads'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            return response()->json([
                'success' => true,
                'message' => 'Email campaigns retrieved successfully',
                'data' => $campaigns,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve email campaigns',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Show a single email campaign
     */
    public function showEmailCampaign(int $id): JsonResponse
    {
        try {
            $campaign = EmailCampaign::with(['template', 'leads'])->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'Email campaign retrieved successfully',
                'data' => $campaign,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email campaign not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve email campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create new email campaign
     */
    public function createEmailCampaign(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'subject' => 'required|string|max:255',
                'template_id' => 'required|exists:marketing_templates,id',
                'lead_ids' => 'nullable|array',
                'group_ids' => 'nullable|array',
                'scheduled_at' => 'nullable|date|after:now',
                'send_immediately' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Collect all lead IDs from individual leads and groups
            $leadIds = $request->lead_ids ?? [];
            if ($request->group_ids) {
                $groupLeads = DB::table('client_group_lead')
                    ->whereIn('client_group_id', $request->group_ids)
                    ->pluck('lead_id')
                    ->toArray();
                $leadIds = array_unique(array_merge($leadIds, $groupLeads));
            }

            if (empty($leadIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No leads selected for the campaign'
                ], 422);
            }

            $campaign = EmailCampaign::create([
                'name' => $request->name,
                'subject' => $request->subject,
                'template_id' => $request->template_id,
                'lead_ids' => $leadIds,
                'scheduled_at' => $request->scheduled_at,
                'send_immediately' => $request->send_immediately ?? false,
                'status' => $request->send_immediately ? 'sending' : 'scheduled',
                'created_by' => auth()->id(),
            ]);

            // Pivot table entries
            foreach ($leadIds as $leadId) {
                DB::table('campaign_leads')->insert([
                    'email_campaign_id' => $campaign->id,
                    'lead_id' => $leadId,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // If send immediately, process the campaign
            if ($request->send_immediately) {
                $this->processEmailCampaign($campaign);
            }

            return response()->json([
                'success' => true,
                'message' => 'Email campaign created successfully',
                'data' => $campaign->load(['template']),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create email campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update existing email campaign
     */
    public function updateEmailCampaign(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'subject' => 'required|string|max:255',
                'template_id' => 'required|exists:marketing_templates,id',
                'lead_ids' => 'nullable|array',
                'group_ids' => 'nullable|array',
                'scheduled_at' => 'nullable|date|after:now',
                'send_immediately' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $campaign = EmailCampaign::findOrFail($id);

            // Collect all lead IDs from individual leads and groups
            $leadIds = $request->lead_ids ?? [];
            if ($request->group_ids) {
                $groupLeads = DB::table('client_group_lead')
                    ->whereIn('client_group_id', $request->group_ids)
                    ->pluck('lead_id')
                    ->toArray();
                $leadIds = array_unique(array_merge($leadIds, $groupLeads));
            }

            if (empty($leadIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No leads selected for the campaign'
                ], 422);
            }

            $campaign->update([
                'name' => $request->name,
                'subject' => $request->subject,
                'template_id' => $request->template_id,
                'lead_ids' => $leadIds,
                'scheduled_at' => $request->scheduled_at,
                'send_immediately' => $request->send_immediately ?? false,
                // If user edits and chooses "send now", move to sending state
                'status' => $request->send_immediately ? 'sending' : $campaign->status,
            ]);

            // Sync pivot table
            DB::table('campaign_leads')->where('email_campaign_id', $campaign->id)->delete();
            foreach ($leadIds as $leadId) {
                DB::table('campaign_leads')->insert([
                    'email_campaign_id' => $campaign->id,
                    'lead_id' => $leadId,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            if ($request->send_immediately) {
                $this->processEmailCampaign($campaign->fresh());
            }

            return response()->json([
                'success' => true,
                'message' => 'Email campaign updated successfully',
                'data' => $campaign->load(['template']),
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email campaign not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update email campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete email campaign
     */
    public function deleteEmailCampaign(int $id): JsonResponse
    {
        try {
            $campaign = EmailCampaign::findOrFail($id);
            $campaign->delete();

            return response()->json([
                'success' => true,
                'message' => 'Email campaign deleted successfully',
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email campaign not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete email campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Duplicate an existing email campaign
     */
    public function duplicateEmailCampaign(int $id): JsonResponse
    {
        try {
            $campaign = EmailCampaign::findOrFail($id);

            $newCampaign = $campaign->replicate([
                'status',
                'sent_count',
                'delivered_count',
                'open_count',
                'click_count',
                'bounce_count',
                'unsubscribe_count',
                'sent_at',
            ]);

            $newCampaign->name = $campaign->name . ' (Copy)';
            $newCampaign->status = 'draft';
            $newCampaign->sent_count = 0;
            $newCampaign->delivered_count = 0;
            $newCampaign->open_count = 0;
            $newCampaign->click_count = 0;
            $newCampaign->bounce_count = 0;
            $newCampaign->unsubscribe_count = 0;
            $newCampaign->sent_at = null;
            $newCampaign->save();

            return response()->json([
                'success' => true,
                'message' => 'Email campaign duplicated successfully',
                'data' => $newCampaign,
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email campaign not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to duplicate email campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Trigger sending of an email campaign
     */
    public function sendEmailCampaign(int $id): JsonResponse
    {
        try {
            $campaign = EmailCampaign::findOrFail($id);

            // Atomic check and update to avoid race conditions
            $affected = EmailCampaign::where('id', $id)
                ->whereNotIn('status', ['sent', 'sending'])
                ->update(['status' => 'sending']);

            if ($affected === 0) {
                // Check if it exists first to give 404, otherwise 400
                if (!EmailCampaign::find($id)) {
                    throw new \Illuminate\Database\Eloquent\ModelNotFoundException;
                }

                return response()->json([
                    'success' => false,
                    'message' => 'Campaign is already being sent or has been completed',
                ], 400);
            }

            // Reload campaign
            $campaign = EmailCampaign::findOrFail($id);
            $result = $this->processEmailCampaign($campaign->fresh());

            if ($result['status'] === 'sent' && $result['sent_count'] > 0) {
                return response()->json([
                    'success' => true,
                    'message' => "Email campaign sent to {$result['sent_count']} lead(s)",
                    'data' => $campaign->refresh()->load(['template']),
                ], 200);
            }

            // Failed case – surface reason to frontend
            return response()->json([
                'success' => false,
                'message' => 'Failed to send email campaign',
                'details' => $result['reason'] ?? null,
                'sent_count' => $result['sent_count'],
            ], 422);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Email campaign not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send email campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get all SMS campaigns
     */
    public function smsCampaigns(): JsonResponse
    {
        try {
            $campaigns = SmsCampaign::with(['template', 'leads'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            return response()->json([
                'success' => true,
                'message' => 'SMS campaigns retrieved successfully',
                'data' => $campaigns,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve SMS campaigns',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create new SMS campaign
     */
    public function createSmsCampaign(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'template_id' => 'required|exists:marketing_templates,id',
                'lead_ids' => 'required|array',
                'lead_ids.*' => 'exists:leads,id',
                'scheduled_at' => 'nullable|date|after:now',
                'send_immediately' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $campaign = SmsCampaign::create([
                'name' => $request->name,
                'template_id' => $request->template_id,
                'lead_ids' => $request->lead_ids,
                'scheduled_at' => $request->scheduled_at,
                'send_immediately' => $request->send_immediately ?? false,
                'status' => $request->send_immediately ? 'sending' : 'scheduled',
                'created_by' => auth()->id(),
            ]);

            // If send immediately, process the campaign
            if ($request->send_immediately) {
                $this->processSmsCampaign($campaign);
            }

            return response()->json([
                'success' => true,
                'message' => 'SMS campaign created successfully',
                'data' => $campaign->load(['template']),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create SMS campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get all WhatsApp campaigns
     */
    public function whatsappCampaigns(): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;
            $campaigns = \App\Models\WhatsAppCampaign::where('company_id', $companyId)
                ->with(['template'])
                ->orderBy('created_at', 'desc')
                ->paginate(10);

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp campaigns retrieved successfully',
                'data' => $campaigns,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('WhatsApp campaigns retrieval failed: ' . $e->getMessage(), [
                'exception' => $e
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve WhatsApp campaigns',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create new WhatsApp campaign
     */
    public function createWhatsappCampaign(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'template_id' => 'required|exists:marketing_templates,id',
                'lead_ids' => 'nullable|array',
                'lead_ids.*' => 'exists:leads,id',
                'group_ids' => 'nullable|array',
                'group_ids.*' => 'exists:client_groups,id',
                'scheduled_at' => 'nullable|date',
                'send_immediately' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $companyId = auth()->user()->company_id;

            // Collect all lead IDs from individual leads and groups
            $leadIds = $request->lead_ids ?? [];
            if ($request->group_ids) {
                $groupLeads = DB::table('client_group_lead')
                    ->whereIn('client_group_id', $request->group_ids)
                    ->pluck('lead_id')
                    ->toArray();
                $leadIds = array_unique(array_merge($leadIds, $groupLeads));
            }

            if (empty($leadIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No leads selected for the campaign'
                ], 422);
            }

            $campaign = \App\Models\WhatsAppCampaign::create([
                'name' => $request->name,
                'template_id' => $request->template_id,
                'lead_ids' => $leadIds,
                'scheduled_at' => $request->scheduled_at,
                'status' => $request->send_immediately ? 'sending' : 'scheduled',
                'created_by' => auth()->id(),
                'company_id' => $companyId,
            ]);

            // Pivot table entries
            foreach ($leadIds as $leadId) {
                DB::table('campaign_leads')->insert([
                    'whatsapp_campaign_id' => $campaign->id,
                    'lead_id' => $leadId,
                    'status' => 'pending',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // If send immediately, you'd trigger processing here
            // if ($request->send_immediately) {
            //     $this->processWhatsappCampaign($campaign);
            // }

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp campaign created successfully',
                'data' => $campaign->load(['template']),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create WhatsApp campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Show specific WhatsApp campaign
     */
    public function showWhatsappCampaign(int $id): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;
            $campaign = \App\Models\WhatsAppCampaign::where('company_id', $companyId)
                ->with(['template'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp campaign retrieved successfully',
                'data' => $campaign,
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Campaign not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve WhatsApp campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update WhatsApp campaign
     */
    public function updateWhatsappCampaign(Request $request, int $id): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;
            $campaign = \App\Models\WhatsAppCampaign::where('company_id', $companyId)->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'template_id' => 'required|exists:marketing_templates,id',
                'scheduled_at' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $campaign->update([
                'name' => $request->name,
                'template_id' => $request->template_id,
                'scheduled_at' => $request->scheduled_at,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp campaign updated successfully',
                'data' => $campaign->load(['template']),
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Campaign not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update WhatsApp campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete WhatsApp campaign
     */
    public function deleteWhatsappCampaign(int $id): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;
            $campaign = \App\Models\WhatsAppCampaign::where('company_id', $companyId)->findOrFail($id);
            $campaign->delete();

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp campaign deleted successfully',
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Campaign not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete WhatsApp campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Send WhatsApp campaign
     */
    public function sendWhatsappCampaign(int $id): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;
            $campaign = \App\Models\WhatsAppCampaign::where('company_id', $companyId)->findOrFail($id);

            if ($campaign->status === 'sent') {
                return response()->json(['success' => false, 'message' => 'Campaign already sent'], 422);
            }

            $campaign->update(['status' => 'sending']);

            // Process sending (async or immediately)
            // For now, let's just mark it as sent for testing UI
            // In real app, you'd call processWhatsappCampaign($campaign)

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp campaign sending started',
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Campaign not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send WhatsApp campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get marketing templates
     */
    public function templates(): JsonResponse
    {
        try {
            $templates = MarketingTemplate::orderBy('created_at', 'desc')->get();

            return response()->json([
                'success' => true,
                'message' => 'Marketing templates retrieved successfully',
                'data' => $templates,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve templates',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create new marketing template
     */
    public function createTemplate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'type' => 'required|in:email,sms,whatsapp',
                'subject' => 'required_if:type,email|string|max:255',
                'content' => 'required|string',
                'variables' => 'nullable|array',
                'is_active' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $template = MarketingTemplate::create([
                'name' => $request->name,
                'type' => $request->type,
                'subject' => $request->subject,
                'content' => $request->content,
                'variables' => $request->variables ?? [],
                'is_active' => $request->is_active ?? true,
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Marketing template created successfully',
                'data' => $template,
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create template',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get marketing analytics
     */
    public function analytics(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'start_date' => 'required|date',
                'end_date' => 'required|date|after_or_equal:start_date',
                'type' => 'nullable|in:email,sms,all',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $startDate = $request->start_date;
            $endDate = $request->end_date;
            $type = $request->type ?? 'all';

            $analytics = [
                'campaign_performance' => $this->getCampaignPerformance($startDate, $endDate, $type),
                'engagement_metrics' => $this->getEngagementMetrics($startDate, $endDate, $type),
                'conversion_tracking' => $this->getConversionTracking($startDate, $endDate, $type),
                'roi_analysis' => $this->getRoiAnalysis($startDate, $endDate, $type),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Marketing analytics retrieved successfully',
                'data' => $analytics,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve analytics',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get leads for marketing
     */
    public function marketingLeads(): JsonResponse
    {
        try {
            $leads = Lead::select(['id', 'name', 'email', 'phone', 'status', 'source', 'created_at'])
                ->where('status', '!=', 'converted')
                ->orderBy('created_at', 'desc')
                ->paginate(20);

            return response()->json([
                'success' => true,
                'message' => 'Marketing leads retrieved successfully',
                'data' => $leads,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve leads',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    // Private helper methods
    private function calculateConversionRate(): float
    {
        $totalSent = EmailCampaign::sum('sent_count') + SmsCampaign::sum('sent_count') + \App\Models\WhatsAppCampaign::sum('sent_count');
        // Simple approximation: count recently created leads as "conversions"
        $totalConversions = Lead::where('created_at', '>=', now()->subDays(30))->count();

        return $totalSent > 0 ? round(($totalConversions / $totalSent) * 100, 2) : 0;
    }

    private function getRecentCampaigns(): array
    {
        $emails = EmailCampaign::with(['template'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'type' => 'email',
                'status' => $c->status,
                'sent_count' => $c->sent_count,
                'date' => $c->created_at,
                'created_at' => $c->created_at->format('Y-m-d H:i')
            ]);

        $sms = SmsCampaign::with(['template'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'type' => 'sms',
                'status' => $c->status,
                'sent_count' => $c->sent_count,
                'date' => $c->created_at,
                'created_at' => $c->created_at->format('Y-m-d H:i')
            ]);

        $whatsapp = \App\Models\WhatsAppCampaign::with(['template'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($c) => [
                'id' => $c->id,
                'name' => $c->name,
                'type' => 'whatsapp',
                'status' => $c->status,
                'sent_count' => $c->sent_count,
                'date' => $c->created_at,
                'created_at' => $c->created_at->format('Y-m-d H:i')
            ]);

        return $emails->merge($sms)->merge($whatsapp)
            ->sortByDesc('date')
            ->take(5)
            ->values()
            ->toArray();
    }

    /**
     * Process and send an email campaign.
     *
     * @return array{status:string,sent_count:int,reason:?string}
     */
    private function processEmailCampaign(EmailCampaign $campaign): array
    {
        try {
            // Load template and leads with error handling
            try {
                $template = $campaign->template;
            } catch (\Exception $templateError) {
                \Log::error('Error loading campaign template', [
                    'campaign_id' => $campaign->id,
                    'template_id' => $campaign->template_id,
                    'error' => $templateError->getMessage()
                ]);

                $campaign->update(['status' => 'failed']);
                return [
                    'status' => 'failed',
                    'sent_count' => 0,
                    'reason' => 'Template not found or inaccessible',
                ];
            }

            if (!$template || !$template->is_active || $template->type !== 'email') {
                \Log::warning('Invalid template for campaign', [
                    'campaign_id' => $campaign->id,
                    'template_id' => $campaign->template_id,
                    'template_active' => $template?->is_active,
                    'template_type' => $template?->type
                ]);

                $campaign->update(['status' => 'failed']);
                return [
                    'status' => 'failed',
                    'sent_count' => 0,
                    'reason' => 'Invalid or inactive email template',
                ];
            }

            // Load leads with error handling
            try {
                $leadIds = (array) $campaign->lead_ids;
                $leads = Lead::whereIn('id', $leadIds)
                    ->whereNotNull('email')
                    ->get()
                    ->unique('email');
            } catch (\Exception $leadError) {
                \Log::error('Error loading campaign leads', [
                    'campaign_id' => $campaign->id,
                    'lead_ids' => $campaign->lead_ids,
                    'error' => $leadError->getMessage()
                ]);

                $campaign->update(['status' => 'failed']);
                return [
                    'status' => 'failed',
                    'sent_count' => 0,
                    'reason' => 'Failed to load campaign leads',
                ];
            }

            if ($leads->isEmpty()) {
                \Log::warning('No valid leads for campaign', [
                    'campaign_id' => $campaign->id,
                    'requested_lead_ids' => $leadIds,
                    'total_requested' => count($leadIds)
                ]);

                $campaign->update([
                    'status' => 'failed',
                    'sent_at' => now(),
                    'sent_count' => 0,
                ]);
                return [
                    'status' => 'failed',
                    'sent_count' => 0,
                    'reason' => 'No leads with valid email addresses',
                ];
            }

            // Prepare company mail settings with error handling
            try {
                $mailSettings = CompanyMailSettingsService::getSettings();
                $useCompanyMail = !empty($mailSettings['enabled']) && (!empty($mailSettings['from_address']) || !empty($mailSettings['from_name']));

                $companyLogo = Setting::getValue('company_logo', '');
                $companyName = $useCompanyMail && !empty($mailSettings['from_name'])
                    ? $mailSettings['from_name']
                    : Setting::getValue('company_name', config('app.name', 'TravelOps'));
                $companyEmail = $useCompanyMail && !empty($mailSettings['from_address'])
                    ? $mailSettings['from_address']
                    : Setting::getValue('company_email', config('mail.from.address', ''));
                $companyPhone = Setting::getValue('company_phone', '');
                $companyAddress = Setting::getValue('company_address', '');

                $fromEmail = $companyEmail ?: config('mail.from.address', 'noreply@travelops.com');
                $fromName = $companyName ?: config('mail.from.name', 'TravelOps');
            } catch (\Exception $settingsError) {
                \Log::error('Error loading company settings for campaign', [
                    'campaign_id' => $campaign->id,
                    'error' => $settingsError->getMessage()
                ]);

                // Use defaults
                $fromEmail = config('mail.from.address', 'noreply@travelops.com');
                $fromName = config('mail.from.name', 'TravelOps');
                $companyName = $fromName;
                $companyLogo = '';
                $companyPhone = '';
                $companyAddress = '';
            }

            $sentCount = 0;
            $lastError = null;
            $failedLeads = [];

            foreach ($leads as $lead) {
                try {
                    // Build variables for this lead
                    $variables = [
                        'name' => $lead->client_name ?? 'Valued Customer',
                        'email' => $lead->email,
                        'phone' => $lead->phone ?? '',
                        'company' => $companyName,
                        'destination' => $lead->destination ?? 'Your Destination',
                    ];

                    $body = $template->processContent($variables);

                    // Simple branded HTML
                    $emailBody = $this->buildEmailBody($campaign->subject, $body, $companyName, $companyLogo, $companyPhone, $companyEmail, $companyAddress);

                    CompanyMailSettingsService::applyIfEnabled();

                    Mail::send([], [], function ($message) use ($lead, $campaign, $emailBody, $fromEmail, $fromName) {
                        $message->from($fromEmail, $fromName)
                            ->to($lead->email)
                            ->subject($campaign->subject)
                            ->html($emailBody);
                    });

                    // Check for mail failures
                    if (Mail::failures()) {
                        throw new \Exception('Mail service returned failure');
                    }

                    $sentCount++;
                    \Log::info('Campaign email sent successfully', [
                        'campaign_id' => $campaign->id,
                        'lead_id' => $lead->id,
                        'email' => $lead->email
                    ]);

                } catch (\Throwable $e) {
                    // Log and continue with next lead
                    \Log::error('Email campaign send failed for lead', [
                        'campaign_id' => $campaign->id,
                        'lead_id' => $lead->id,
                        'email' => $lead->email,
                        'error' => $e->getMessage(),
                        'error_type' => get_class($e)
                    ]);

                    $lastError = $e->getMessage();
                    $failedLeads[] = [
                        'lead_id' => $lead->id,
                        'email' => $lead->email,
                        'error' => $e->getMessage()
                    ];
                }
            }

            $status = $sentCount > 0 ? 'sent' : 'failed';

            try {
                $campaign->update([
                    'status' => $status,
                    'sent_at' => now(),
                    'sent_count' => $sentCount,
                ]);
            } catch (\Exception $updateError) {
                \Log::error('Error updating campaign status', [
                    'campaign_id' => $campaign->id,
                    'error' => $updateError->getMessage()
                ]);
            }

            \Log::info('Email campaign processing completed', [
                'campaign_id' => $campaign->id,
                'status' => $status,
                'sent_count' => $sentCount,
                'total_leads' => $leads->count(),
                'failed_count' => count($failedLeads)
            ]);

            return [
                'status' => $status,
                'sent_count' => $sentCount,
                'reason' => $status === 'sent'
                    ? null
                    : ($lastError ?: 'Unknown error while sending emails'),
                'failed_leads' => $failedLeads
            ];

        } catch (\Exception $e) {
            \Log::error('Critical error in email campaign processing', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null
            ]);

            try {
                $campaign->update(['status' => 'failed']);
            } catch (\Exception $updateError) {
                \Log::error('Failed to update campaign status after critical error', [
                    'campaign_id' => $campaign->id,
                    'error' => $updateError->getMessage()
                ]);
            }

            return [
                'status' => 'failed',
                'sent_count' => 0,
                'reason' => 'Critical error during campaign processing',
            ];
        }
    }

    private function processSmsCampaign(SmsCampaign $campaign): void
    {
        try {
            // Load leads with error handling
            $leadIds = (array) $campaign->lead_ids;
            $leads = Lead::whereIn('id', $leadIds)
                ->whereNotNull('phone')
                ->get();

            if ($leads->isEmpty()) {
                \Log::warning('No valid leads for SMS campaign', [
                    'campaign_id' => $campaign->id,
                    'requested_lead_ids' => $leadIds
                ]);

                $campaign->update(['status' => 'failed']);
                return;
            }

            // Process SMS sending (placeholder for actual SMS integration)
            $sentCount = 0;
            foreach ($leads as $lead) {
                try {
                    // TODO: Integrate with actual SMS service (Twilio, etc.)
                    // For now, just log the attempt
                    \Log::info('SMS would be sent', [
                        'campaign_id' => $campaign->id,
                        'lead_id' => $lead->id,
                        'phone' => $lead->phone
                    ]);

                    $sentCount++;
                } catch (\Exception $smsError) {
                    \Log::error('Failed to send SMS to lead', [
                        'campaign_id' => $campaign->id,
                        'lead_id' => $lead->id,
                        'phone' => $lead->phone,
                        'error' => $smsError->getMessage()
                    ]);
                }
            }

            $status = $sentCount > 0 ? 'sent' : 'failed';

            $campaign->update([
                'status' => $status,
                'sent_at' => now(),
                'sent_count' => $sentCount,
            ]);

            // Update lead status
            if ($sentCount > 0) {
                Lead::whereIn('id', $campaign->lead_ids)
                    ->update(['last_contacted_at' => now()]);
            }

            \Log::info('SMS campaign processing completed', [
                'campaign_id' => $campaign->id,
                'status' => $status,
                'sent_count' => $sentCount,
                'total_leads' => $leads->count()
            ]);

        } catch (\Exception $e) {
            \Log::error('Critical error in SMS campaign processing', [
                'campaign_id' => $campaign->id,
                'error' => $e->getMessage()
            ]);

            $campaign->update(['status' => 'failed']);
        }
    }

    /**
     * Build email body HTML template
     */
    private function buildEmailBody(string $subject, string $body, string $companyName, string $companyLogo = '', string $companyPhone = '', string $companyEmail = '', string $companyAddress = ''): string
    {
        return '<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>' . htmlspecialchars($subject) . '</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 30px 40px; text-align: center;">
                                    ' . ($companyLogo ? '<img src="' . $companyLogo . '" alt="' . htmlspecialchars($companyName) . '" style="max-height: 60px; margin-bottom: 10px;">' : '') . '
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">' . htmlspecialchars($companyName) . '</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px;">
                                    <div style="color: #333333; font-size: 15px; line-height: 1.6;">
                                        ' . nl2br(htmlspecialchars($body)) . '
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="color: #6b7280; font-size: 13px;">
                                                <p style="margin: 0 0 10px 0;"><strong>' . htmlspecialchars($companyName) . '</strong></p>
                                                ' . ($companyPhone ? '<p style="margin: 0 0 5px 0;">📞 ' . htmlspecialchars($companyPhone) . '</p>' : '') . '
                                                ' . ($companyEmail ? '<p style="margin: 0 0 5px 0;">✉️ ' . htmlspecialchars($companyEmail) . '</p>' : '') . '
                                                ' . ($companyAddress ? '<p style="margin: 0;">📍 ' . htmlspecialchars($companyAddress) . '</p>' : '') . '
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>';
    }

    private function getCampaignPerformance(string $startDate, string $endDate, string $type): array
    {
        // Implementation for campaign performance metrics
        return [
            'total_campaigns' => 0,
            'successful_campaigns' => 0,
            'failed_campaigns' => 0,
            'average_open_rate' => 0,
            'average_click_rate' => 0,
        ];
    }

    private function getEngagementMetrics(string $startDate, string $endDate, string $type): array
    {
        // Implementation for engagement metrics
        return [
            'total_opens' => 0,
            'total_clicks' => 0,
            'unique_opens' => 0,
            'unique_clicks' => 0,
            'bounce_rate' => 0,
        ];
    }

    private function getConversionTracking(string $startDate, string $endDate, string $type): array
    {
        // Implementation for conversion tracking
        return [
            'total_conversions' => 0,
            'conversion_rate' => 0,
            'cost_per_conversion' => 0,
            'revenue_generated' => 0,
        ];
    }

    private function getRoiAnalysis(string $startDate, string $endDate, string $type): array
    {
        // Implementation for ROI analysis
        return [
            'total_cost' => 0,
            'total_revenue' => 0,
            'roi_percentage' => 0,
            'break_even_point' => null,
        ];
    }

    /**
     * Get all client groups
     */
    public function clientGroups(): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;

            $groups = ClientGroup::where('company_id', $companyId)
                ->withCount('leads')
                ->with('creator:id,name')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($g) {
                    $leadIds = $g->leads()->pluck('leads.id');
                    $revenueData = DB::table('lead_payments')
                        ->whereIn('lead_id', $leadIds)
                        ->selectRaw('COALESCE(SUM(amount), 0) as total, COUNT(DISTINCT lead_id) as cnt')
                        ->first();
                    $totalRevenue = (float) ($revenueData->total ?? 0);
                    $clientCount = $g->leads_count;
                    $avgBooking = $clientCount > 0 ? round($totalRevenue / $clientCount, 2) : 0;

                    return [
                        'id' => $g->id,
                        'name' => $g->name,
                        'description' => $g->description,
                        'client_count' => $clientCount,
                        'type' => $g->type,
                        'created_at' => $g->created_at?->format('Y-m-d'),
                        'created_by' => $g->creator?->name ?? 'System',
                        'status' => $g->status,
                        'total_revenue' => $totalRevenue,
                        'avg_booking_value' => $avgBooking,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Client groups retrieved successfully',
                'data' => $groups
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve client groups',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create new client group
     */
    public function createClientGroup(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'type' => 'required|in:premium,corporate,family,international,leisure',
                'status' => 'nullable|in:active,inactive',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $group = ClientGroup::create([
                'company_id' => auth()->user()->company_id,
                'name' => $request->name,
                'description' => $request->description,
                'type' => $request->type,
                'status' => $request->status ?? 'active',
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Client group created successfully',
                'data' => [
                    'id' => $group->id,
                    'name' => $group->name,
                    'description' => $group->description,
                    'type' => $group->type,
                    'status' => $group->status,
                    'client_count' => 0,
                    'created_at' => $group->created_at->format('Y-m-d'),
                    'created_by' => auth()->user()->name,
                    'total_revenue' => 0,
                    'avg_booking_value' => 0,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create client group',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Show specific client group
     */
    public function showClientGroup($id): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;
            $g = ClientGroup::where('company_id', $companyId)->with('creator:id,name')->findOrFail($id);

            $leadIds = $g->leads()->pluck('leads.id');
            $revenueData = DB::table('lead_payments')
                ->whereIn('lead_id', $leadIds)
                ->selectRaw('COALESCE(SUM(amount), 0) as total')
                ->first();
            $totalRevenue = (float) ($revenueData->total ?? 0);
            $clientCount = $g->leads()->count();
            $avgBooking = $clientCount > 0 ? round($totalRevenue / $clientCount, 2) : 0;

            return response()->json([
                'success' => true,
                'message' => 'Client group retrieved successfully',
                'data' => [
                    'id' => $g->id,
                    'name' => $g->name,
                    'description' => $g->description,
                    'client_count' => $clientCount,
                    'type' => $g->type,
                    'created_at' => $g->created_at?->format('Y-m-d'),
                    'created_by' => $g->creator?->name ?? 'System',
                    'status' => $g->status,
                    'total_revenue' => $totalRevenue,
                    'avg_booking_value' => $avgBooking,
                ]
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Client group not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve client group',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update client group
     */
    public function updateClientGroup(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'status' => 'required|in:active,inactive',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $companyId = auth()->user()->company_id;
            $group = ClientGroup::where('company_id', $companyId)->findOrFail($id);
            $group->update([
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Client group updated successfully',
                'data' => [
                    'id' => $group->id,
                    'name' => $group->name,
                    'description' => $group->description,
                    'status' => $group->status,
                ]
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Client group not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update client group',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete client group
     */
    public function deleteClientGroup($id): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;
            $group = ClientGroup::where('company_id', $companyId)->findOrFail($id);
            $group->delete();

            return response()->json([
                'success' => true,
                'message' => 'Client group deleted successfully'
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Client group not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete client group',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Add clients to group
     */
    public function addClientsToGroup(Request $request, $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'client_ids' => 'required|array',
                'client_ids.*' => 'exists:leads,id',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $companyId = auth()->user()->company_id;
            $group = ClientGroup::where('company_id', $companyId)->findOrFail($id);
            $group->leads()->syncWithoutDetaching($request->client_ids);

            return response()->json([
                'success' => true,
                'message' => 'Clients added to group successfully',
                'added_count' => count($request->client_ids)
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Client group not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add clients to group',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get all landing pages
     */
    public function landingPages(): JsonResponse
    {
        try {
            $companyId = auth()->user()?->company_id;
            $pages = LandingPage::when($companyId, fn($q) => $q->where('company_id', $companyId))
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'name' => $p->name,
                    'title' => $p->title,
                    'url' => $p->url_slug,
                    'status' => $p->status,
                    'views' => $p->views,
                    'conversions' => $p->conversions,
                    'conversion_rate' => (float) $p->conversion_rate,
                    'created_at' => $p->created_at?->format('Y-m-d'),
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Landing pages retrieved successfully',
                'data' => $pages,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve landing pages',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create new landing page
     */
    public function createLandingPage(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'title' => 'required|string|max:255',
                'url_slug' => 'required|string|max:255|regex:/^[a-z0-9-]+$/',
                'template' => 'nullable|string|max:50',
                'meta_description' => 'nullable|string|max:500',
                'status' => 'nullable|in:draft,published',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $companyId = auth()->user()?->company_id;
            $slug = strtolower($request->url_slug);

            if (LandingPage::where('company_id', $companyId)->where('url_slug', $slug)->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'A landing page with this URL slug already exists',
                ], 422);
            }

            $template = $request->template ?? 'travel-package';
            $defaultSections = LandingPageTemplateService::getDefaultSections($template);

            $page = LandingPage::create([
                'company_id' => $companyId,
                'name' => $request->name,
                'title' => $request->title,
                'url_slug' => $slug,
                'template' => $template,
                'meta_description' => $request->meta_description,
                'sections' => $request->sections ?? $defaultSections,
                'status' => $request->status ?? 'draft',
                'published_at' => $request->status === 'published' ? now() : null,
                'created_by' => auth()->id(),
            ]);

            $data = [
                'id' => $page->id,
                'name' => $page->name,
                'title' => $page->title,
                'url' => $page->url_slug,
                'template' => $page->template,
                'sections' => $page->sections,
                'status' => $page->status,
                'views' => 0,
                'conversions' => 0,
                'conversion_rate' => 0,
                'created_at' => $page->created_at?->format('Y-m-d'),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Landing page created successfully',
                'data' => $data,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create landing page',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Upload image for landing page (logo, hero, package images)
     */
    public function uploadLandingPageImage(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'image' => 'required|image|mimes:jpeg,jpg,png,gif,webp,svg|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $file = $request->file('image');
            $path = $file->store('landing-pages', 'public');
            $url = url('storage/' . $path);

            return response()->json([
                'success' => true,
                'message' => 'Image uploaded successfully',
                'data' => ['url' => $url, 'path' => $path],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload image',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update landing page
     */
    public function updateLandingPage(Request $request, int $id): JsonResponse
    {
        try {
            $companyId = auth()->user()?->company_id;
            $page = LandingPage::when($companyId, fn($q) => $q->where('company_id', $companyId))
                ->findOrFail($id);

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'title' => 'sometimes|required|string|max:255',
                'url_slug' => 'sometimes|required|string|max:255|regex:/^[a-z0-9-]+$/',
                'template' => 'nullable|string|max:50',
                'meta_description' => 'nullable|string|max:500',
                'status' => 'nullable|in:draft,published',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $updateData = $request->only(['name', 'title', 'template', 'meta_description', 'sections', 'status']);
            if ($request->has('url_slug')) {
                $slug = strtolower($request->url_slug);
                if (LandingPage::where('company_id', $companyId)->where('url_slug', $slug)->where('id', '!=', $id)->exists()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'A landing page with this URL slug already exists',
                    ], 422);
                }
                $updateData['url_slug'] = $slug;
            }
            if ($request->status === 'published' && $page->status !== 'published') {
                $updateData['published_at'] = now();
            }

            $page->update($updateData);

            $data = [
                'id' => $page->id,
                'name' => $page->name,
                'title' => $page->title,
                'url' => $page->url_slug,
                'template' => $page->template,
                'sections' => $page->sections,
                'status' => $page->status,
                'views' => $page->views,
                'conversions' => $page->conversions,
                'conversion_rate' => (float) $page->conversion_rate,
                'created_at' => $page->created_at?->format('Y-m-d'),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Landing page updated successfully',
                'data' => $data,
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Landing page not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update landing page',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete landing page
     */
    public function deleteLandingPage(int $id): JsonResponse
    {
        try {
            $companyId = auth()->user()?->company_id;
            $page = LandingPage::when($companyId, fn($q) => $q->where('company_id', $companyId))
                ->findOrFail($id);
            $page->delete();

            return response()->json([
                'success' => true,
                'message' => 'Landing page deleted successfully',
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Landing page not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete landing page',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Publish landing page
     */
    public function publishLandingPage(int $id): JsonResponse
    {
        try {
            $companyId = auth()->user()?->company_id;
            $page = LandingPage::when($companyId, fn($q) => $q->where('company_id', $companyId))
                ->findOrFail($id);
            $page->update(['status' => 'published', 'published_at' => now()]);

            return response()->json([
                'success' => true,
                'message' => 'Landing page published successfully',
                'data' => [
                    'id' => $page->id,
                    'status' => $page->status,
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Landing page not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to publish landing page',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Preview landing page (admin)
     */
    public function previewLandingPage(int $id): JsonResponse
    {
        try {
            $companyId = auth()->user()?->company_id;
            $page = LandingPage::when($companyId, fn($q) => $q->where('company_id', $companyId))
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $page->id,
                    'name' => $page->name,
                    'title' => $page->title,
                    'url_slug' => $page->url_slug,
                    'content' => $page->content,
                    'template' => $page->template,
                    'sections' => $page->sections ?? LandingPageTemplateService::getDefaultSections($page->template ?? 'travel-package'),
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Landing page not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to preview landing page',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get landing page by id
     */
    public function getLandingPage(int $id): JsonResponse
    {
        try {
            $companyId = auth()->user()?->company_id;
            $page = LandingPage::when($companyId, fn($q) => $q->where('company_id', $companyId))
                ->findOrFail($id);

            $sections = $page->sections ?? LandingPageTemplateService::getDefaultSections($page->template ?? 'travel-package');

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $page->id,
                    'name' => $page->name,
                    'title' => $page->title,
                    'url' => $page->url_slug,
                    'url_slug' => $page->url_slug,
                    'template' => $page->template,
                    'meta_description' => $page->meta_description,
                    'sections' => $sections,
                    'status' => $page->status,
                    'views' => $page->views,
                    'conversions' => $page->conversions,
                    'conversion_rate' => (float) $page->conversion_rate,
                    'created_at' => $page->created_at?->format('Y-m-d'),
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Landing page not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve landing page',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Public landing page view (no auth) - for displaying the page
     */
    public function publicLandingPage(string $slug): JsonResponse
    {
        try {
            $page = LandingPage::where('url_slug', $slug)
                ->where('status', 'published')
                ->firstOrFail();

            $sections = $page->sections ?? LandingPageTemplateService::getDefaultSections($page->template ?? 'travel-package');

            return response()->json([
                'success' => true,
                'data' => [
                    'name' => $page->name,
                    'title' => $page->title,
                    'content' => $page->content,
                    'template' => $page->template,
                    'meta_description' => $page->meta_description,
                    'sections' => $sections,
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Landing page not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load landing page',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Submit enquiry/query from landing page (public, no auth)
     */
    public function submitLandingPageEnquiry(Request $request, string $slug): JsonResponse
    {
        try {
            $page = LandingPage::where('url_slug', $slug)->where('status', 'published')->firstOrFail();
            $companyId = $page->company_id;

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255',
                'phone' => 'required|string|max:20',
                'city' => 'nullable|string|max:100',
                'destination' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $validator->validated();
            $remark = trim(implode(' | ', array_filter([
                $data['city'] ? 'City: ' . $data['city'] : '',
                $data['destination'] ? 'Destination: ' . $data['destination'] : '',
            ])));

            $createdBy = $companyId
                ? User::where('company_id', $companyId)->value('id')
                : User::first()?->id;

            Lead::create([
                'client_name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'],
                'source' => 'Landing Page: ' . $page->name,
                'destination' => $data['destination'] ?? null,
                'remark' => $remark ?: 'Enquiry from landing page',
                'company_id' => $companyId,
                'created_by' => $createdBy ?? 1,
                'status' => 'new',
                'priority' => 'warm',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Thank you! We will contact you soon.',
            ], 201);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Landing page not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit enquiry',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get group clients
     */
    public function getGroupClients($id): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;
            $group = ClientGroup::where('company_id', $companyId)->findOrFail($id);

            $clients = $group->leads()
                ->select('leads.id', 'leads.client_name as name', 'leads.email', 'leads.phone', 'leads.status')
                ->get()
                ->map(fn($l) => [
                    'id' => $l->id,
                    'name' => $l->name,
                    'email' => $l->email,
                    'mobile' => $l->phone,
                    'status' => $l->status,
                ]);

            return response()->json([
                'success' => true,
                'message' => 'Group clients retrieved successfully',
                'data' => $clients
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['success' => false, 'message' => 'Client group not found'], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve group clients',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
