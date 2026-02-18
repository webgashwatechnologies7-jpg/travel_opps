<?php

namespace App\Http\Controllers;

use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\Setting;
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
            $lead = $this->findLeadForUser($request, $leadId);
            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            $lead->load('company');
            $html = $this->buildVoucherHtml($lead);

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
            $lead = $this->findLeadForUser($request, $leadId);
            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            $lead->load(['company', 'creator']);

            // Use DomPDF to generate PDF
            $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.voucher', compact('lead'));

            // Enable options
            $pdf->setOption([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
                'defaultFont' => 'DejaVu Sans'
            ]);

            $pdf->setPaper('a4', 'portrait');

            $fileName = 'Voucher-Lead-' . $lead->id . '-' . now()->format('Ymd') . '.pdf';

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

            $lead = $this->findLeadForUser($request, $leadId);
            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            $toEmail = $request->input('to_email') ?: $lead->email;
            if (!$toEmail) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer email not available',
                ], 422);
            }

            $subject = $request->input('subject') ?: 'Travel Voucher';
            $html = $this->buildVoucherHtml($lead);

            CompanyMailSettingsService::applyIfEnabled();

            Mail::send([], [], function ($message) use ($toEmail, $subject, $html) {
                $message->to($toEmail)
                    ->subject($subject)
                    ->html($html);
            });


            \Log::info('Voucher sent successfully', [
                'lead_id' => $leadId,
                'to_email' => $toEmail,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Voucher sent successfully',
                'data' => [
                    'to_email' => $toEmail,
                    'subject' => $subject,
                ]
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
     * Find lead by ID for authenticated user (bypass global scope, match company_id).
     */
    private function findLeadForUser(Request $request, int $leadId): ?Lead
    {
        try {
            $user = $request->user();
            if (!$user) {
                \Log::warning('No authenticated user found in voucher request', [
                    'lead_id' => $leadId
                ]);
                return null;
            }

            // Bypass HasCompany scope so we find lead even when tenant is not set
            $lead = Lead::withoutGlobalScopes()->find($leadId);
            if (!$lead) {
                \Log::warning('Lead not found in voucher request', [
                    'lead_id' => $leadId,
                    'user_id' => $user->id
                ]);
                return null;
            }

            $companyId = $user->company_id ?? null;
            $leadCompanyId = $lead->company_id ?? null;

            // Allow: same company, or lead has no company (null)
            if ($leadCompanyId !== null && $companyId !== null && $leadCompanyId !== $companyId) {
                \Log::warning('Access denied - company mismatch in voucher request', [
                    'lead_id' => $leadId,
                    'user_id' => $user->id,
                    'user_company_id' => $companyId,
                    'lead_company_id' => $leadCompanyId
                ]);
                return null;
            }

            return $lead;

        } catch (\Exception $e) {
            \Log::error('Error finding lead for voucher', [
                'error' => $e->getMessage(),
                'lead_id' => $leadId,
                'user_id' => auth()->id()
            ]);
            return null;
        }
    }

    private function buildVoucherHtml(Lead $lead): string
    {
        return view('pdf.voucher', compact('lead'))->render();
    }
}
