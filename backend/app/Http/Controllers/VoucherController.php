<?php

namespace App\Http\Controllers;

use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\Setting;
use App\Models\Quotation;
use App\Models\QueryProposal;
use App\Models\Package;
use App\Models\LeadInvoice;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use App\Services\CompanyMailSettingsService;

class VoucherController extends Controller
{
    public function preview(Request $request, int $leadId)
    {
        try {
            $data = $this->prepareVoucherData($request, $leadId);
            if (!$data) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found or unauthorized',
                ], 404);
            }

            $html = view('pdf.voucher', $data)->render();

            return response($html, 200, [
                'Content-Type' => 'text/html; charset=UTF-8',
            ]);

        } catch (\Exception $e) {
            \Log::error('Voucher preview error', [
                'error' => $e->getMessage(),
                'lead_id' => $leadId,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to generate voucher preview',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function download(Request $request, int $leadId)
    {
        try {
            $data = $this->prepareVoucherData($request, $leadId);
            if (!$data) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found or unauthorized',
                ], 404);
            }

            // Use DomPDF to generate PDF
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.voucher', $data);

            // Enable options
            $pdf->setOption([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'defaultFont' => 'DejaVu Sans'
            ]);

            $pdf->setPaper('a4', 'portrait');

            $fileName = 'Confirmation-Voucher-' . ($data['lead']->query_id ?? $data['lead']->id) . '.pdf';

            return $pdf->download($fileName);

        } catch (\Exception $e) {
            \Log::error('Voucher download error', [
                'error' => $e->getMessage(),
                'lead_id' => $leadId,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to download voucher PDF',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function send(Request $request, int $leadId): JsonResponse
    {
        try {
            // Validate input
            $validator = \Validator::make($request->all(), [
                'to_email' => 'nullable|email',
                'subject' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $data = $this->prepareVoucherData($request, $leadId);
            if (!$data) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found or unauthorized',
                ], 404);
            }

            $lead = $data['lead'];
            $toEmail = $request->input('to_email') ?: $lead->email;
            if (!$toEmail) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer email not available',
                ], 422);
            }

            $subject = $request->input('subject') ?: 'Confirmation Voucher - ' . ($lead->query_id ?? $lead->id);
            $html = view('pdf.voucher', $data)->render();

            CompanyMailSettingsService::applyIfEnabled();

            Mail::send([], [], function ($message) use ($toEmail, $subject, $html) {
                $message->to($toEmail)
                    ->subject($subject)
                    ->html($html);
            });

            return response()->json([
                'success' => true,
                'message' => 'Voucher sent successfully',
            ]);

        } catch (\Exception $e) {
            \Log::error('Voucher send error', [
                'error' => $e->getMessage(),
                'lead_id' => $leadId,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send voucher',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Prepare all data needed for voucher view
     */
    private function prepareVoucherData(Request $request, int $leadId): ?array
    {
        $user = $request->user();
        if (!$user)
            return null;

        \Log::info('Voucher preparation start', ['lead_id' => $leadId, 'proposal_id' => $request->query('proposal_id')]);

        $lead = Lead::withoutGlobalScopes()->find($leadId);
        if (!$lead)
            return null;

        if ($lead->company_id !== null && $user->company_id !== null && $lead->company_id !== $user->company_id) {
            return null;
        }

        $lead->load(['company', 'creator', 'payments']);

        // Find confirmed invoice to get the option number
        $invoice = LeadInvoice::where('lead_id', $leadId)
            ->where('status', 'sent')
            ->orderBy('id', 'desc')
            ->first();

        $confirmedOption = $invoice ? (int) $invoice->option_number : 1;

        // Try to find proposal data (Modern way - LeadProposal)
        $proposalId = $request->query('proposal_id');
        $proposal = null;
        
        if ($proposalId) {
            // 1. Try direct ID match (Database ID)
            $proposal = \App\Models\LeadProposal::where('lead_id', $leadId)->where('id', $proposalId)->first();
            
            // 2. Safety fallback for timestamp IDs (internal frontend IDs)
            if (!$proposal) {
                $allLeadProposals = \App\Models\LeadProposal::where('lead_id', $leadId)->get();
                foreach ($allLeadProposals as $p) {
                    if ($p->options_data && is_array($p->options_data)) {
                        foreach ($p->options_data as $opt) {
                            if (isset($opt['id']) && $opt['id'] == $proposalId) {
                                $proposal = $p;
                                break 2;
                            }
                        }
                    }
                }
            }
        }
        
        if (!$proposal) {
            // Pick confirmed one first, otherwise latest
            $proposal = \App\Models\LeadProposal::where('lead_id', $leadId)->where('is_confirmed', true)->first()
                      ?? \App\Models\LeadProposal::where('lead_id', $leadId)->orderBy('created_at', 'desc')->first();
        }

        $quotation = null;
        if ($proposal) {
            // LeadProposal stores data in direct columns
            $packageId = $proposal->original_package_id;
            $package = $packageId ? Package::find($packageId) : null;

            $quotation = new \stdClass();
            $quotation->total_price = $proposal->price;
            
            // Pass proposal dates for the blade to use instead of lead dates
            $quotation->start_date = $proposal->start_date;
            $quotation->end_date = $proposal->end_date;
            $quotation->duration = $proposal->duration;
            
            // Construct a simple breakdown since pricing_data might be in internal format
            $breakdown = [];
            if ($proposal->price > 0) {
                $breakdown[] = [
                    'label' => 'Full Tour Package',
                    'count' => 1,
                    'price' => $proposal->price,
                    'total' => $proposal->price
                ];
            }
            
            $quotation->pricing_breakdown = [
                $confirmedOption => [
                    'final' => $proposal->price,
                    'breakdown' => $breakdown
                ]
            ];

            // Prioritize LeadProposal columns
            $rawDays = $proposal->days ?? ($package ? $package->days : []);
            $rawDayEvents = $proposal->day_events ?? ($package ? $package->day_events : []);

            // Ensure day_events are indexed 1, 2, 3... for the blade
            $dayEvents = [];
            $i = 1;
            if (is_array($rawDayEvents)) {
                foreach ($rawDayEvents as $events) {
                    $dayEvents[$i++] = $events;
                }
            }

            $vehicleName = 'Private Cab';
            if (!empty($dayEvents)) {
                foreach ($dayEvents as $events) {
                    if (!is_array($events))
                        continue;
                    foreach ($events as $event) {
                        if (isset($event['eventType']) && in_array(strtolower($event['eventType']), ['transportation', 'transport'])) {
                            $vehicleName = $event['subject'] ?? $vehicleName;
                            break 2;
                        }
                    }
                }
            }

            $quotation->itinerary = [
                'days' => $rawDays,
                'day_events' => $dayEvents,
                'routing' => $proposal->routing ?? ($package ? $package->routing : 'N/A'),
                'inclusions' => $proposal->inclusions ?? ($package ? $package->inclusions : []),
                'exclusions' => $proposal->exclusions ?? ($package ? $package->exclusions : []),
                'terms' => $proposal->terms_conditions ?? ($package ? $package->terms_conditions : []),
                'transportation' => [
                    'vehicle' => $vehicleName
                ]
            ];
        } else {
            // Fallback to legacy QueryProposal or Quotation
            $qProposal = QueryProposal::where('lead_id', $leadId)
                ->orderBy('created_at', 'desc')
                ->first();
                
            if ($qProposal) {
                $packageId = $qProposal->metadata['itinerary_id'] ?? null;
                $package = $packageId ? Package::find($packageId) : null;

                $quotation = new \stdClass();
                $quotation->total_price = $qProposal->total_amount;
                $quotation->pricing_breakdown = [
                    $confirmedOption => [
                        'final' => $qProposal->total_amount,
                        'breakdown' => $qProposal->metadata['breakdown'] ?? []
                    ]
                ];

                $rawDayEvents = $qProposal->metadata['day_events'] ?? ($package ? $package->day_events : []);
                $dayEvents = [];
                $i = 1;
                foreach ($rawDayEvents as $events) {
                    $dayEvents[$i++] = $events;
                }

                $quotation->itinerary = [
                    'days' => $qProposal->metadata['days'] ?? ($package ? $package->days : []),
                    'day_events' => $dayEvents,
                    'routing' => $qProposal->metadata['destination'] ?? ($qProposal->metadata['itinerary_name'] ?? ($package ? $package->routing : 'N/A')),
                    'inclusions' => $qProposal->metadata['inclusions'] ?? ($package ? $package->inclusions : []),
                    'exclusions' => $qProposal->metadata['exclusions'] ?? ($package ? $package->exclusions : []),
                    'terms' => $qProposal->metadata['terms'] ?? ($package ? $package->terms_conditions : []),
                    'transportation' => [
                        'vehicle' => 'Private Cab'
                    ]
                ];
            } else {
                $quotation = Quotation::where('lead_id', $leadId)
                    ->orderBy('created_at', 'desc')
                    ->first();
            }
        }

        return [
            'lead' => $lead,
            'quotation' => $quotation,
            'invoice' => $invoice,
            'confirmedOption' => $confirmedOption
        ];
    }
}
