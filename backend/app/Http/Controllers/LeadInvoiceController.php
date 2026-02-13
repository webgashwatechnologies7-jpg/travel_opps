<?php

namespace App\Http\Controllers;

use App\Modules\Leads\Domain\Entities\Lead;
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

    public function download(Request $request, int $leadId, int $invoiceId)
    {
        $invoice = $this->resolveInvoice($request, $leadId, $invoiceId);
        if (!$invoice) {
            return response()->json(['success' => false, 'message' => 'Invoice not found'], 404);
        }

        // Use DomPDF to generate PDF
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.invoice', compact('invoice'));

        // Enable options
        $pdf->setOption([
            'isRemoteEnabled' => true,
            'isHtml5ParserEnabled' => true,
            'defaultFont' => 'DejaVu Sans'
        ]);

        $pdf->setPaper('a4', 'portrait');

        $fileName = 'Invoice-' . ($invoice->invoice_number ?? $invoice->id) . '.pdf';

        return $pdf->download($fileName);
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
        return $invoice ? $invoice->load('lead.company') : null;
    }

    private function buildInvoiceHtml(LeadInvoice $invoice): string
    {
        return view('pdf.invoice', compact('invoice'))->render();
    }
}
