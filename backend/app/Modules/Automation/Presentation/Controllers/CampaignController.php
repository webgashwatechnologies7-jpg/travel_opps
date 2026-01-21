<?php

namespace App\Modules\Automation\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Automation\Domain\Entities\Campaign;
use App\Modules\Automation\Infrastructure\ExternalServices\WhatsappService;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use App\Services\CompanyMailSettingsService;

class CampaignController extends Controller
{
    /**
     * @var WhatsappService
     */
    protected WhatsappService $whatsappService;

    /**
     * CampaignController constructor.
     *
     * @param WhatsappService $whatsappService
     */
    public function __construct(WhatsappService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Create a new campaign.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'channel' => 'required|in:whatsapp,email',
                'message_template' => 'required|string',
                'target_source' => 'nullable|string|max:100',
                'schedule_at' => 'nullable|date',
            ], [
                'name.required' => 'The name field is required.',
                'name.max' => 'The name may not be greater than 255 characters.',
                'channel.required' => 'The channel field is required.',
                'channel.in' => 'The channel must be either whatsapp or email.',
                'message_template.required' => 'The message_template field is required.',
                'target_source.max' => 'The target_source may not be greater than 100 characters.',
                'schedule_at.date' => 'The schedule_at must be a valid date.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $campaign = Campaign::create([
                'name' => $request->name,
                'channel' => $request->channel,
                'message_template' => $request->message_template,
                'target_source' => $request->target_source,
                'schedule_at' => $request->schedule_at,
                'created_by' => $request->user()->id,
            ]);

            // Load creator relationship
            $campaign->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Campaign created successfully',
                'data' => [
                    'campaign' => [
                        'id' => $campaign->id,
                        'name' => $campaign->name,
                        'channel' => $campaign->channel,
                        'message_template' => $campaign->message_template,
                        'target_source' => $campaign->target_source,
                        'schedule_at' => $campaign->schedule_at,
                        'last_run_at' => $campaign->last_run_at,
                        'total_sent' => $campaign->total_sent,
                        'created_by' => $campaign->created_by,
                        'creator' => $campaign->creator ? [
                            'id' => $campaign->creator->id,
                            'name' => $campaign->creator->name,
                            'email' => $campaign->creator->email,
                        ] : null,
                        'created_at' => $campaign->created_at,
                        'updated_at' => $campaign->updated_at,
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get all campaigns.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $campaigns = Campaign::with('creator')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($campaign) {
                    return [
                        'id' => $campaign->id,
                        'name' => $campaign->name,
                        'channel' => $campaign->channel,
                        'message_template' => $campaign->message_template,
                        'target_source' => $campaign->target_source,
                        'schedule_at' => $campaign->schedule_at,
                        'last_run_at' => $campaign->last_run_at,
                        'total_sent' => $campaign->total_sent,
                        'created_by' => $campaign->created_by,
                        'creator' => $campaign->creator ? [
                            'id' => $campaign->creator->id,
                            'name' => $campaign->creator->name,
                            'email' => $campaign->creator->email,
                        ] : null,
                        'created_at' => $campaign->created_at,
                        'updated_at' => $campaign->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Campaigns retrieved successfully',
                'data' => [
                    'campaigns' => $campaigns,
                    'count' => $campaigns->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving campaigns',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Run a campaign.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function run(Request $request, int $id): JsonResponse
    {
        try {
            $campaign = Campaign::find($id);

            if (!$campaign) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campaign not found',
                ], 404);
            }

            // Check if campaign is scheduled for future
            if ($campaign->schedule_at && $campaign->schedule_at->isFuture()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Campaign is scheduled for ' . $campaign->schedule_at->format('Y-m-d H:i:s') . '. Cannot run before scheduled time.',
                ], 400);
            }

            // Get target leads based on target_source
            $leadsQuery = Lead::query();

            if ($campaign->target_source) {
                $leadsQuery->where('source', $campaign->target_source);
            }

            $leads = $leadsQuery->get();

            if ($leads->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No leads found matching the campaign criteria',
                ], 404);
            }

            $sentCount = 0;
            $failedCount = 0;
            $errors = [];

            // Process each lead
            foreach ($leads as $lead) {
                try {
                    // Replace template variables
                    $message = $this->replaceTemplateVariables($campaign->message_template, $lead);

                    if ($campaign->channel === 'whatsapp') {
                        // Send WhatsApp message
                        if (empty($lead->phone)) {
                            $failedCount++;
                            $errors[] = "Lead #{$lead->id} ({$lead->client_name}) has no phone number";
                            continue;
                        }

                        $result = $this->whatsappService->sendMessage(
                            $lead->phone,
                            $message,
                            $lead->id
                        );

                        if ($result) {
                            $sentCount++;
                        } else {
                            $failedCount++;
                            $errors[] = "Failed to send WhatsApp to Lead #{$lead->id} ({$lead->client_name})";
                        }
                    } elseif ($campaign->channel === 'email') {
                        // Send Email
                        if (empty($lead->email)) {
                            $failedCount++;
                            $errors[] = "Lead #{$lead->id} ({$lead->client_name}) has no email address";
                            continue;
                        }

                        try {
                            CompanyMailSettingsService::applyIfEnabled();
                            Mail::raw($message, function ($mail) use ($lead) {
                                $mail->to($lead->email)
                                    ->subject('Travel Inquiry');
                            });
                            $sentCount++;
                        } catch (\Exception $e) {
                            $failedCount++;
                            $errors[] = "Failed to send email to Lead #{$lead->id} ({$lead->client_name}): " . $e->getMessage();
                            Log::error("Campaign email send failed", [
                                'campaign_id' => $campaign->id,
                                'lead_id' => $lead->id,
                                'error' => $e->getMessage(),
                            ]);
                        }
                    }
                } catch (\Exception $e) {
                    $failedCount++;
                    $errors[] = "Error processing Lead #{$lead->id} ({$lead->client_name}): " . $e->getMessage();
                    Log::error("Campaign processing error", [
                        'campaign_id' => $campaign->id,
                        'lead_id' => $lead->id,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            // Update campaign statistics
            $campaign->update([
                'last_run_at' => now(),
                'total_sent' => $campaign->total_sent + $sentCount,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Campaign executed successfully',
                'data' => [
                    'campaign_id' => $campaign->id,
                    'campaign_name' => $campaign->name,
                    'total_leads' => $leads->count(),
                    'sent' => $sentCount,
                    'failed' => $failedCount,
                    'errors' => $errors,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while running campaign',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Replace template variables with lead data.
     *
     * @param string $template
     * @param Lead $lead
     * @return string
     */
    protected function replaceTemplateVariables(string $template, Lead $lead): string
    {
        $replacements = [
            '{{client_name}}' => $lead->client_name ?? '',
            '{{email}}' => $lead->email ?? '',
            '{{phone}}' => $lead->phone ?? '',
            '{{source}}' => $lead->source ?? '',
            '{{destination}}' => $lead->destination ?? '',
        ];

        $message = $template;
        foreach ($replacements as $placeholder => $value) {
            $message = str_replace($placeholder, $value, $message);
        }

        return $message;
    }
}

