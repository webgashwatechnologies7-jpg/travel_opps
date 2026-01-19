<?php

namespace App\Http\Controllers;

use App\Models\EmailCampaign;
use App\Models\SmsCampaign;
use App\Models\MarketingTemplate;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\User;
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
            // Add company filtering for multi-tenant
            $companyId = auth()->user()->company_id;
            
            $stats = [
                'total_campaigns' => EmailCampaign::where('company_id', $companyId)->count() + 
                                     SmsCampaign::where('company_id', $companyId)->count(),
                'active_campaigns' => EmailCampaign::where('company_id', $companyId)->where('status', 'active')->count() + 
                                     SmsCampaign::where('company_id', $companyId)->where('status', 'active')->count(),
                'total_sent' => EmailCampaign::where('company_id', $companyId)->sum('sent_count') + 
                               SmsCampaign::where('company_id', $companyId)->sum('sent_count'),
                'total_opens' => EmailCampaign::where('company_id', $companyId)->sum('open_count'),
                'total_clicks' => EmailCampaign::where('company_id', $companyId)->sum('click_count'),
                'conversion_rate' => $this->calculateConversionRate($companyId),
                'recent_campaigns' => $this->getRecentCampaigns($companyId),
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
        $totalConversions = Lead::where('converted_at', '>=', now()->subDays(30))->count();
        
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

    private function processEmailCampaign(EmailCampaign $campaign): void
    {
        // Implementation for sending email campaign
        $campaign->update(['status' => 'sent', 'sent_at' => now()]);
        
        // Update lead status
        Lead::whereIn('id', $campaign->lead_ids)
            ->update(['last_contacted_at' => now()]);
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
            // Mock data - replace with actual database query
            $groups = [
                [
                    'id' => 1,
                    'name' => 'VIP Clients',
                    'description' => 'High-value clients with premium services',
                    'client_count' => 45,
                    'type' => 'premium',
                    'created_at' => '2024-01-15',
                    'created_by' => 'John Doe',
                    'status' => 'active',
                    'total_revenue' => 125000,
                    'avg_booking_value' => 2500
                ],
                [
                    'id' => 2,
                    'name' => 'Corporate Groups',
                    'description' => 'Business clients and corporate bookings',
                    'client_count' => 32,
                    'type' => 'corporate',
                    'created_at' => '2024-01-12',
                    'created_by' => 'Jane Smith',
                    'status' => 'active',
                    'total_revenue' => 89000,
                    'avg_booking_value' => 1800
                ]
            ];

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
                'status' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Mock implementation - replace with actual database save
            $group = [
                'id' => rand(1000, 9999),
                'name' => $request->name,
                'description' => $request->description,
                'type' => $request->type,
                'status' => $request->status ? 'active' : 'inactive',
                'client_count' => 0,
                'created_at' => now()->format('Y-m-d'),
                'created_by' => auth()->user()->name,
                'total_revenue' => 0,
                'avg_booking_value' => 0
            ];

            return response()->json([
                'success' => true,
                'message' => 'Client group created successfully',
                'data' => $group
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
            // Mock implementation - replace with actual database query
            $group = [
                'id' => $id,
                'name' => 'VIP Clients',
                'description' => 'High-value clients with premium services',
                'client_count' => 45,
                'type' => 'premium',
                'created_at' => '2024-01-15',
                'created_by' => 'John Doe',
                'status' => 'active',
                'total_revenue' => 125000,
                'avg_booking_value' => 2500
            ];

            return response()->json([
                'success' => true,
                'message' => 'Client group retrieved successfully',
                'data' => $group
            ], 200);

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

            // Mock implementation - replace with actual database update
            $updatedGroup = [
                'id' => $id,
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status,
                'updated_at' => now()->format('Y-m-d H:i:s')
            ];

            return response()->json([
                'success' => true,
                'message' => 'Client group updated successfully',
                'data' => $updatedGroup
            ], 200);

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
            // Mock implementation - replace with actual database delete
            return response()->json([
                'success' => true,
                'message' => 'Client group deleted successfully'
            ], 200);

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

            // Mock implementation
            return response()->json([
                'success' => true,
                'message' => 'Clients added to group successfully',
                'added_count' => count($request->client_ids)
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add clients to group',
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
            // Mock implementation - replace with actual database query
            $clients = [
                [
                    'id' => 1,
                    'name' => 'John Smith',
                    'email' => 'john@example.com',
                    'phone' => '+1234567890',
                    'status' => 'active'
                ],
                [
                    'id' => 2,
                    'name' => 'Jane Doe',
                    'email' => 'jane@example.com',
                    'phone' => '+1234567891',
                    'status' => 'active'
                ]
            ];

            return response()->json([
                'success' => true,
                'message' => 'Group clients retrieved successfully',
                'data' => $clients
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve group clients',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
