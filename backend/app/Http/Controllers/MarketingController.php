<?php

namespace App\Http\Controllers;

use App\Models\ClientGroup;
use App\Models\EmailCampaign;
use App\Models\SmsCampaign;
use App\Models\MarketingTemplate;
use App\Models\LandingPage;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\User;
use App\Models\Setting;
use App\Services\CompanyMailSettingsService;
use Illuminate\Support\Facades\Mail;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
                'total_campaigns' => EmailCampaign::count() + SmsCampaign::count(),
                'active_campaigns' => EmailCampaign::where('status', 'active')->count() +
                                     SmsCampaign::where('status', 'active')->count(),
                'total_sent' => EmailCampaign::sum('sent_count') + SmsCampaign::sum('sent_count'),
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

            $campaign = EmailCampaign::create([
                'name' => $request->name,
                'subject' => $request->subject,
                'template_id' => $request->template_id,
                'lead_ids' => $request->lead_ids,
                'scheduled_at' => $request->scheduled_at,
                'send_immediately' => $request->send_immediately ?? false,
                'status' => $request->send_immediately ? 'sending' : 'scheduled',
                'created_by' => auth()->id(),
            ]);

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

            $campaign = EmailCampaign::findOrFail($id);

            $campaign->update([
                'name' => $request->name,
                'subject' => $request->subject,
                'template_id' => $request->template_id,
                'lead_ids' => $request->lead_ids,
                'scheduled_at' => $request->scheduled_at,
                'send_immediately' => $request->send_immediately ?? false,
                // If user edits and chooses "send now", move to sending state
                'status' => $request->send_immediately ? 'sending' : $campaign->status,
            ]);

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

            if ($campaign->status === 'sent') {
                return response()->json([
                    'success' => false,
                    'message' => 'Campaign has already been sent',
                ], 400);
            }

            // Move to sending state and process
            $campaign->update(['status' => 'sending']);
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
        $totalSent = EmailCampaign::sum('sent_count') + SmsCampaign::sum('sent_count');
        // Simple approximation: count recently created leads as "conversions"
        $totalConversions = Lead::where('created_at', '>=', now()->subDays(30))->count();
        
        return $totalSent > 0 ? round(($totalConversions / $totalSent) * 100, 2) : 0;
    }
    
    private function getRecentCampaigns(): array
    {
        return EmailCampaign::with(['template'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($campaign) {
                return [
                    'id' => $campaign->id,
                    'name' => $campaign->name,
                    'type' => 'email',
                    'status' => $campaign->status,
                    'sent_count' => $campaign->sent_count,
                    'open_rate' => $campaign->open_rate,
                    'created_at' => $campaign->created_at->format('Y-m-d H:i'),
                ];
            })
            ->toArray();
    }

    /**
     * Process and send an email campaign.
     *
     * @return array{status:string,sent_count:int,reason:?string}
     */
    private function processEmailCampaign(EmailCampaign $campaign): array
    {
        // Load template and leads
        $template = $campaign->template;
        if (!$template || !$template->is_active || $template->type !== 'email') {
            // If template invalid, just mark as failed
            $campaign->update(['status' => 'failed']);
            return [
                'status' => 'failed',
                'sent_count' => 0,
                'reason' => 'Invalid or inactive email template',
            ];
        }

        $leadIds = (array) $campaign->lead_ids;
        $leads = Lead::whereIn('id', $leadIds)
            ->whereNotNull('email')
            ->get();

        if ($leads->isEmpty()) {
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

        // Prepare company mail settings
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

        $sentCount = 0;
        $lastError = null;

        foreach ($leads as $lead) {
            try {
                // Build variables for this lead
                $variables = [
                    'name' => $lead->client_name,
                    'email' => $lead->email,
                    'phone' => $lead->phone,
                    'company' => $companyName,
                    'destination' => $lead->destination,
                ];

                $body = $template->processContent($variables);

                // Simple branded HTML (copied from NotificationController style)
                $emailBody = '<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>' . htmlspecialchars($campaign->subject) . '</title>
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

                CompanyMailSettingsService::applyIfEnabled();

                Mail::send([], [], function ($message) use ($lead, $campaign, $emailBody, $fromEmail, $fromName) {
                    $message->from($fromEmail, $fromName)
                        ->to($lead->email)
                        ->subject($campaign->subject)
                        ->html($emailBody);
                });

                $sentCount++;
            } catch (\Throwable $e) {
                // Log and continue with next lead
                \Log::error('Email campaign send failed for lead', [
                    'campaign_id' => $campaign->id,
                    'lead_id' => $lead->id,
                    'error' => $e->getMessage(),
                ]);
                $lastError = $e->getMessage();
            }
        }

        $status = $sentCount > 0 ? 'sent' : 'failed';

        $campaign->update([
            'status' => $status,
            'sent_at' => now(),
            'sent_count' => $sentCount,
        ]);

        return [
            'status' => $status,
            'sent_count' => $sentCount,
            'reason' => $status === 'sent'
                ? null
                : ($lastError ?: 'Unknown error while sending emails'),
        ];
    }

    private function processSmsCampaign(SmsCampaign $campaign): void
    {
        // Implementation for sending SMS campaign
        $campaign->update(['status' => 'sent', 'sent_at' => now()]);
        
        // Update lead status
        Lead::whereIn('id', $campaign->lead_ids)
            ->update(['last_contacted_at' => now()]);
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
            $pages = LandingPage::when($companyId, fn ($q) => $q->where('company_id', $companyId))
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn ($p) => [
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

            $page = LandingPage::create([
                'company_id' => $companyId,
                'name' => $request->name,
                'title' => $request->title,
                'url_slug' => $slug,
                'template' => $request->template ?? 'lead-capture',
                'meta_description' => $request->meta_description,
                'status' => $request->status ?? 'draft',
                'published_at' => $request->status === 'published' ? now() : null,
                'created_by' => auth()->id(),
            ]);

            $data = [
                'id' => $page->id,
                'name' => $page->name,
                'title' => $page->title,
                'url' => $page->url_slug,
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
     * Update landing page
     */
    public function updateLandingPage(Request $request, int $id): JsonResponse
    {
        try {
            $companyId = auth()->user()?->company_id;
            $page = LandingPage::when($companyId, fn ($q) => $q->where('company_id', $companyId))
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

            $updateData = $request->only(['name', 'title', 'template', 'meta_description', 'status']);
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
            $page = LandingPage::when($companyId, fn ($q) => $q->where('company_id', $companyId))
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
            $page = LandingPage::when($companyId, fn ($q) => $q->where('company_id', $companyId))
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
            $page = LandingPage::when($companyId, fn ($q) => $q->where('company_id', $companyId))
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
            $page = LandingPage::when($companyId, fn ($q) => $q->where('company_id', $companyId))
                ->findOrFail($id);

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

            return response()->json([
                'success' => true,
                'data' => [
                    'name' => $page->name,
                    'title' => $page->title,
                    'content' => $page->content,
                    'template' => $page->template,
                    'meta_description' => $page->meta_description,
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
                ->map(fn ($l) => [
                    'id' => $l->id,
                    'name' => $l->name,
                    'email' => $l->email,
                    'phone' => $l->phone,
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
