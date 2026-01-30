<?php

namespace App\Http\Controllers;

use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use App\Services\CompanyMailSettingsService;

class VoucherController extends Controller
{
    public function preview(Request $request, int $leadId)
    {
        $lead = $this->findLeadForUser($request, $leadId);
        if (!$lead) {
            return response()->json([
                'success' => false,
                'message' => 'Lead not found',
            ], 404);
        }

        $html = $this->buildVoucherHtml($lead);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    public function download(Request $request, int $leadId)
    {
        $lead = $this->findLeadForUser($request, $leadId);
        if (!$lead) {
            return response()->json([
                'success' => false,
                'message' => 'Lead not found',
            ], 404);
        }

        $html = $this->buildVoucherHtml($lead);

        $companyId = $request->user()->company_id;
        $fileName = 'voucher-lead-' . $lead->id . '-' . now()->format('YmdHis') . '.html';
        $path = "vouchers/{$companyId}/{$fileName}";

        Storage::disk('public')->put($path, $html);

        return response()->download(Storage::disk('public')->path($path), $fileName);
    }

    public function send(Request $request, int $leadId): JsonResponse
    {
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

        try {
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
            return response()->json([
                'success' => false,
                'message' => 'Failed to send voucher',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Find lead by ID for the authenticated user (bypass global scope, match company_id).
     */
    private function findLeadForUser(Request $request, int $leadId): ?Lead
    {
        $user = $request->user();
        if (!$user) {
            return null;
        }
        // Bypass HasCompany scope so we find the lead even when tenant is not set
        $lead = Lead::withoutGlobalScopes()->find($leadId);
        if (!$lead) {
            return null;
        }
        $companyId = $user->company_id ?? null;
        $leadCompanyId = $lead->company_id ?? null;
        // Allow: same company, or lead has no company (null)
        if ($leadCompanyId !== null && $companyId !== null && $leadCompanyId !== $companyId) {
            return null;
        }
        return $lead;
    }

    private function buildVoucherHtml(Lead $lead): string
    {
        $clientName = htmlspecialchars((string) ($lead->client_name ?? 'Customer'), ENT_QUOTES, 'UTF-8');
        $destination = htmlspecialchars((string) ($lead->destination ?? ''), ENT_QUOTES, 'UTF-8');
        $phone = htmlspecialchars((string) ($lead->phone ?? ''), ENT_QUOTES, 'UTF-8');
        $email = htmlspecialchars((string) ($lead->email ?? ''), ENT_QUOTES, 'UTF-8');

        $queryId = htmlspecialchars((string) ($lead->query_id ?? $lead->id), ENT_QUOTES, 'UTF-8');
        $generatedAt = htmlspecialchars(now()->format('d-m-Y H:i'), ENT_QUOTES, 'UTF-8');

        return '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Voucher</title>
<style>
body{font-family:Arial, sans-serif; background:#f3f4f6; padding:20px;}
.container{max-width:800px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;}
.header{background:linear-gradient(135deg,#2563eb,#3b82f6); color:#fff; padding:24px;}
.header h1{margin:0; font-size:22px;}
.meta{opacity:.9; margin-top:6px; font-size:12px;}
.section{padding:20px 24px;}
.row{display:flex; gap:16px; flex-wrap:wrap;}
.card{flex:1; min-width:220px; border:1px solid #e5e7eb; border-radius:10px; padding:14px; background:#f9fafb;}
.card h3{margin:0 0 10px 0; font-size:14px; color:#111827;}
.card p{margin:0; color:#374151; font-size:13px; line-height:1.6;}
.footer{padding:16px 24px; border-top:1px solid #e5e7eb; color:#6b7280; font-size:12px;}
.badge{display:inline-block; padding:6px 10px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:600;}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>Travel Voucher</h1>
    <div class="meta">Query ID: ' . $queryId . ' | Generated: ' . $generatedAt . '</div>
  </div>
  <div class="section">
    <div class="row">
      <div class="card">
        <h3>Customer</h3>
        <p><strong>Name:</strong> ' . $clientName . '</p>
        <p><strong>Phone:</strong> ' . $phone . '</p>
        <p><strong>Email:</strong> ' . $email . '</p>
      </div>
      <div class="card">
        <h3>Trip</h3>
        <p><strong>Destination:</strong> ' . $destination . '</p>
        <p><span class="badge">Draft Voucher</span></p>
      </div>
    </div>
  </div>
  <div class="footer">
    This is a printable voucher preview. For a true PDF, we can add a PDF generator library.
  </div>
</div>
</body>
</html>';
    }
}
