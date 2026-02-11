<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use App\Models\LeadInvoice;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Mail;
use App\Services\CompanyMailSettingsService;

class LeadInvoiceController extends Controller
{
    public function preview(Request $request, int $leadId, int $invoiceId)
    {
        $invoice = $this->resolveInvoice($request, $leadId, $invoiceId);
        if (!$invoice) {
            return response()->json(['success' => false, 'message' => 'Invoice not found'], 404);
        }

        $html = $this->buildInvoiceHtml($invoice);
        return response($html, 200, ['Content-Type' => 'text/html; charset=UTF-8']);
    }

    public function send(Request $request, int $leadId, int $invoiceId): \Illuminate\Http\JsonResponse
    {
        $invoice = $this->resolveInvoice($request, $leadId, $invoiceId);
        if (!$invoice) {
            return response()->json(['success' => false, 'message' => 'Invoice not found'], 404);
        }

        $toEmail = $request->input('to_email') ?: $invoice->lead->email;
        if (!$toEmail) {
            return response()->json(['success' => false, 'message' => 'Customer email not available'], 422);
        }

        $subject = $request->input('subject') ?: 'Invoice ' . $invoice->invoice_number;
        $html = $this->buildInvoiceHtml($invoice);

        try {
            CompanyMailSettingsService::applyIfEnabled();
            Mail::send([], [], function ($message) use ($toEmail, $subject, $html) {
                $message->to($toEmail)->subject($subject)->html($html);
            });
            return response()->json(['success' => true, 'message' => 'Invoice sent successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send invoice',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    private function resolveInvoice(Request $request, int $leadId, int $invoiceId): ?LeadInvoice
    {
        $user = $request->user();
        if (!$user) {
            return null;
        }
        $lead = Lead::withoutGlobalScopes()->find($leadId);
        if (!$lead || ($lead->company_id !== null && $user->company_id !== null && $lead->company_id !== $user->company_id)) {
            return null;
        }
        $invoice = LeadInvoice::where('lead_id', $leadId)->where('id', $invoiceId)->first();
        return $invoice ? $invoice->load('lead') : null;
    }

    private function buildInvoiceHtml(LeadInvoice $invoice): string
    {
        $lead = $invoice->lead;

        $companyLogo = Setting::getValue('company_logo', '');
        $companyName = Setting::getValue('company_name', config('app.name', 'TravelOps'));
        $companyAddress = Setting::getValue('company_address', '');
        $companyPhone = Setting::getValue('company_phone', '');
        $companyEmail = Setting::getValue('company_email', config('mail.from.address', ''));
        if ($companyLogo && !preg_match('#^https?://#i', $companyLogo)) {
            $companyLogo = url($companyLogo);
        }
        $companyName = htmlspecialchars((string) $companyName, ENT_QUOTES, 'UTF-8');
        $companyAddress = htmlspecialchars((string) $companyAddress, ENT_QUOTES, 'UTF-8');
        $companyPhone = htmlspecialchars((string) $companyPhone, ENT_QUOTES, 'UTF-8');
        $companyEmail = htmlspecialchars((string) $companyEmail, ENT_QUOTES, 'UTF-8');

        $invNum = htmlspecialchars($invoice->invoice_number ?? '', ENT_QUOTES, 'UTF-8');
        $optionNum = htmlspecialchars((string) $invoice->option_number, ENT_QUOTES, 'UTF-8');
        $itineraryName = htmlspecialchars((string) ($invoice->itinerary_name ?? ''), ENT_QUOTES, 'UTF-8');
        $totalAmount = number_format((float) $invoice->total_amount, 2);
        $currency = htmlspecialchars((string) ($invoice->currency ?? 'INR'), ENT_QUOTES, 'UTF-8');
        $status = htmlspecialchars((string) ($invoice->status ?? 'pending'), ENT_QUOTES, 'UTF-8');
        $createdAt = $invoice->created_at ? $invoice->created_at->format('d-m-Y') : '';

        $clientName = htmlspecialchars((string) ($lead->client_name ?? 'Customer'), ENT_QUOTES, 'UTF-8');
        $clientEmail = htmlspecialchars((string) ($lead->email ?? ''), ENT_QUOTES, 'UTF-8');
        $clientPhone = htmlspecialchars((string) ($lead->phone ?? ''), ENT_QUOTES, 'UTF-8');
        $destination = htmlspecialchars((string) ($lead->destination ?? ''), ENT_QUOTES, 'UTF-8');

        $companyHeaderHtml = '<div class="company-header">';
        if ($companyLogo) {
            $companyHeaderHtml .= '<img src="' . htmlspecialchars($companyLogo, ENT_QUOTES, 'UTF-8') . '" alt="' . $companyName . '" class="company-logo" />';
        } else {
            $companyHeaderHtml .= '<div class="company-name-only">' . $companyName . '</div>';
        }
        $companyHeaderHtml .= '<div class="company-details"><div class="company-name">' . $companyName . '</div>';
        if ($companyAddress) {
            $companyHeaderHtml .= '<div class="company-addr">' . $companyAddress . '</div>';
        }
        $companyHeaderHtml .= '<div class="company-contact">📞 ' . $companyPhone . ' | ✉ ' . $companyEmail . '</div></div></div>';

        return '<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ' . $invNum . '</title>
<style>
body{font-family:Arial,sans-serif;background:#f3f4f6;padding:20px;}
.container{max-width:800px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;}
.company-header{background:linear-gradient(135deg,#1e40af,#2563eb);color:#fff;padding:20px 24px;display:flex;align-items:center;gap:20px;flex-wrap:wrap;}
.company-logo{height:52px;max-width:180px;object-fit:contain;}
.company-name-only{font-size:24px;font-weight:bold;}
.company-details{flex:1;min-width:180px;}
.company-name{font-size:20px;font-weight:bold;margin-bottom:6px;}
.company-addr,.company-contact{font-size:13px;opacity:.95;}
.invoice-title{background:linear-gradient(135deg,#2563eb,#3b82f6);color:#fff;padding:20px 24px;}
.invoice-title h1{margin:0;font-size:22px;}
.section{padding:24px;}
.table{width:100%;border-collapse:collapse;}
.table th,.table td{padding:10px 12px;text-align:left;border-bottom:1px solid #e5e7eb;}
.table th{background:#f9fafb;font-weight:600;color:#374151;}
.amount{font-size:20px;font-weight:bold;color:#059669;}
.badge{display:inline-block;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600;}
.badge-paid{background:#d1fae5;color:#065f46;}
.badge-pending{background:#fef3c7;color:#92400e;}
.footer{padding:16px 24px;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px;}
</style>
</head>
<body>
<div class="container">' . $companyHeaderHtml . '
  <div class="invoice-title">
    <h1>Invoice ' . $invNum . '</h1>
    <div style="opacity:.9;margin-top:6px;font-size:13px;">Generated: ' . $createdAt . '</div>
  </div>
  <div class="section">
    <table class="table">
      <tr><th>Invoice No.</th><td>' . $invNum . '</td></tr>
      <tr><th>Option</th><td>Option ' . $optionNum . '</td></tr>
      <tr><th>Itinerary</th><td>' . $itineraryName . '</td></tr>
      <tr><th>Status</th><td><span class="badge ' . ($status === 'paid' ? 'badge-paid' : 'badge-pending') . '">' . $status . '</span></td></tr>
    </table>
    <h3 style="margin-top:24px;margin-bottom:12px;">Bill To</h3>
    <p><strong>' . $clientName . '</strong></p>
    <p>Email: ' . $clientEmail . '</p>
    <p>Phone: ' . $clientPhone . '</p>
    <p>Destination: ' . $destination . '</p>
    <div style="margin-top:24px;padding:16px;background:#f0fdf4;border-radius:8px;border:2px solid #22c55e;">
      <div style="font-size:14px;color:#166534;">Total Amount</div>
      <div class="amount">₹' . $totalAmount . '</div>
    </div>
  </div>
  <div class="footer">
    Thank you for your business. This invoice can be printed or saved as PDF.
  </div>
</div>
</body>
</html>';
    }
}
