<?php

namespace App\Http\Controllers;

use App\Models\LeadInvoice;
use App\Models\QueryHistoryLog;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeadConfirmOptionController extends Controller
{
    /**
     * When user confirms an option: create invoice, log voucher created, log option confirmed.
     * All reflected in query history.
     */
    public function __invoke(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'option_number' => 'required|integer|min:1',
            'total_amount' => 'required|numeric|min:0',
            'itinerary_name' => 'nullable|string|max:255',
        ], [
            'option_number.required' => 'Option number is required.',
            'total_amount.required' => 'Total amount is required.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Unauthenticated'], 401);
        }

        $lead = Lead::find($id);
        if (!$lead || (isset($lead->company_id) && $lead->company_id !== $user->company_id)) {
            return response()->json([
                'success' => false,
                'message' => 'Lead not found',
            ], 404);
        }

        try {
            $optionNumber = (int) $request->option_number;
            $totalAmount = (float) $request->total_amount;
            $itineraryName = $request->input('itinerary_name', '');

            // 1) Create or Update invoice for confirmed option
            // Get ALL invoices for this option (there may be duplicates from previous saves)
            $allInvoices = LeadInvoice::where('lead_id', $lead->id)
                ->where('option_number', $optionNumber)
                ->orderBy('id', 'desc') // Latest first
                ->get();

            if ($allInvoices->count() > 1) {
                // Keep the latest invoice, delete the rest (cleanup duplicates)
                $idsToDelete = $allInvoices->skip(1)->pluck('id');
                LeadInvoice::whereIn('id', $idsToDelete)->delete();
            }

            $invoice = $allInvoices->first(); // Latest invoice (or null if none)

            if ($invoice) {
                // Update existing invoice with the current confirmed amount
                $invoice->update([
                    'total_amount' => $totalAmount,
                    'itinerary_name' => $itineraryName,
                    'currency' => 'INR',
                    'metadata' => array_merge($invoice->metadata ?? [], [
                        'last_confirmed_at' => now()->toIso8601String(),
                        'last_confirmed_by' => $user->id,
                        'previous_amount' => $invoice->total_amount,
                    ]),
                ]);

                // Log invoice updated
                QueryHistoryLog::logActivity([
                    'lead_id' => $lead->id,
                    'activity_type' => 'invoice_updated',
                    'activity_description' => "Invoice {$invoice->invoice_number} updated for Option {$optionNumber} - New Amount: ₹" . number_format($totalAmount, 2),
                    'module' => 'invoice',
                    'record_id' => $invoice->id,
                    'metadata' => [
                        'invoice_number' => $invoice->invoice_number,
                        'option_number' => $optionNumber,
                        'total_amount' => $totalAmount,
                        'previous_amount' => $invoice->getOriginal('total_amount'),
                    ],
                ]);

            } else {
                // No invoice exists yet — create a fresh one
                $invoice = LeadInvoice::create([
                    'lead_id' => $lead->id,
                    'option_number' => $optionNumber,
                    'total_amount' => $totalAmount,
                    'currency' => 'INR',
                    'itinerary_name' => $itineraryName,
                    'invoice_number' => LeadInvoice::generateInvoiceNumber(),
                    'status' => 'sent',
                    'metadata' => [
                        'confirmed_at' => now()->toIso8601String(),
                        'confirmed_by' => $user->id,
                    ],
                    'created_by' => $user->id,
                ]);

                // Log invoice created
                QueryHistoryLog::logActivity([
                    'lead_id' => $lead->id,
                    'activity_type' => 'invoice_created',
                    'activity_description' => "Invoice {$invoice->invoice_number} created for Option {$optionNumber} - ₹" . number_format($totalAmount, 2),
                    'module' => 'invoice',
                    'record_id' => $invoice->id,
                    'metadata' => [
                        'invoice_number' => $invoice->invoice_number,
                        'option_number' => $optionNumber,
                        'total_amount' => $totalAmount,
                    ],
                ]);
            }

            // 2) Log option confirmed
            QueryHistoryLog::logActivity([
                'lead_id' => $lead->id,
                'activity_type' => 'option_confirmed',
                'activity_description' => "Option {$optionNumber} confirmed" . ($itineraryName ? " - {$itineraryName}" : '') . ". Amount: ₹" . number_format($totalAmount, 2),
                'module' => 'quotation',
                'record_id' => $invoice->id,
                'metadata' => [
                    'option_number' => $optionNumber,
                    'total_amount' => $totalAmount,
                    'itinerary_name' => $itineraryName,
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                ],
            ]);

            // 4) Log voucher created (voucher is available via Voucher tab - preview/download)
            QueryHistoryLog::logActivity([
                'lead_id' => $lead->id,
                'activity_type' => 'voucher_created',
                'activity_description' => "Voucher generated for Option {$optionNumber}. Available in Voucher tab for download/send.",
                'module' => 'voucher',
                'record_id' => null,
                'metadata' => [
                    'option_number' => $optionNumber,
                ],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Option confirmed. Invoice and voucher created.',
                'data' => [
                    'invoice' => [
                        'id' => $invoice->id,
                        'invoice_number' => $invoice->invoice_number,
                        'option_number' => $invoice->option_number,
                        'total_amount' => $invoice->total_amount,
                        'itinerary_name' => $invoice->itinerary_name,
                        'status' => $invoice->status,
                    ],
                ],
            ], 201);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to confirm option',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
