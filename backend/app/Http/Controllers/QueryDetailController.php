<?php

namespace App\Http\Controllers;

use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class QueryDetailController extends Controller
{
    /**
     * Get comprehensive query/lead details
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            // Get lead with all relationships
            $lead = Lead::with([
                'user:id,name,email',
                'assignedUser:id,name,email',
                'proposals.items',
                'proposals.attachments',
                'followups.user:id,name',
                'payments.creator:id,name',
                'supplierCommunications.user:id,name',
                'vouchers.creator:id,name',
                'documents.uploader:id,name',
                'invoices.items',
                'invoices.payments',
                'billingRecords.creator:id,name',
                'activityHistories.user:id,name'
            ])->findOrFail($id);

            // Calculate billing summary
            $billingSummary = $this->calculateBillingSummary($lead);

            // Get activity history logs
            $activityLogs = $this->getActivityLogs($id);

            // Prepare response data
            $response = [
                'lead' => [
                    'id' => $lead->id,
                    'query_id' => $lead->query_id,
                    'client_name' => $lead->client_name,
                    'client_title' => $lead->client_title,
                    'email' => $lead->email,
                    'phone' => $lead->phone,
                    'destination' => $lead->destination,
                    'travel_start_date' => $lead->travel_start_date,
                    'travel_end_date' => $lead->travel_end_date,
                    'adult' => $lead->adult,
                    'child' => $lead->child,
                    'infant' => $lead->infant,
                    'budget' => $lead->budget,
                    'status' => $lead->status,
                    'priority' => $lead->priority,
                    'source' => $lead->source,
                    'remark' => $lead->remark,
                    'created_at' => $lead->created_at,
                    'updated_at' => $lead->updated_at,
                    'created_by' => $lead->user,
                    'assigned_to' => $lead->assignedUser
                ],
                'proposals' => $lead->proposals->map(function ($proposal) {
                    return [
                        'id' => $proposal->id,
                        'title' => $proposal->title,
                        'description' => $proposal->description,
                        'total_amount' => $proposal->total_amount,
                        'currency' => $proposal->currency,
                        'status' => $proposal->status,
                        'valid_until' => $proposal->valid_until,
                        'is_confirmed' => $proposal->is_confirmed,
                        'sent_at' => $proposal->sent_at,
                        'created_at' => $proposal->created_at,
                        'items_count' => $proposal->items->count(),
                        'attachments_count' => $proposal->attachments->count(),
                        'items' => $proposal->items->map(function ($item) {
                            return [
                                'id' => $item->id,
                                'item_name' => $item->item_name,
                                'description' => $item->description,
                                'quantity' => $item->quantity,
                                'unit_price' => $item->unit_price,
                                'total_price' => $item->total_price
                            ];
                        }),
                        'attachments' => $proposal->attachments->map(function ($attachment) {
                            return [
                                'id' => $attachment->id,
                                'file_name' => $attachment->file_name,
                                'file_path' => $attachment->file_path,
                                'file_size' => $attachment->file_size,
                                'uploaded_at' => $attachment->created_at
                            ];
                        })
                    ];
                }),
                'followups' => $lead->followups->map(function ($followup) {
                    return [
                        'id' => $followup->id,
                        'remark' => $followup->remark,
                        'reminder_date' => $followup->reminder_date,
                        'reminder_time' => $followup->reminder_time,
                        'is_completed' => $followup->is_completed,
                        'completed_at' => $followup->completed_at,
                        'created_at' => $followup->created_at,
                        'created_by' => $followup->user
                    ];
                }),
                'payments' => $lead->payments->map(function ($payment) {
                    return [
                        'id' => $payment->id,
                        'amount' => $payment->amount,
                        'paid_amount' => $payment->paid_amount,
                        'due_amount' => $payment->due_amount,
                        'due_date' => $payment->due_date,
                        'status' => $payment->status,
                        'payment_method' => $payment->payment_method,
                        'transaction_id' => $payment->transaction_id,
                        'notes' => $payment->notes,
                        'created_at' => $payment->created_at,
                        'created_by' => $payment->creator
                    ];
                }),
                'supplier_communications' => $lead->supplierCommunications->map(function ($comm) {
                    return [
                        'id' => $comm->id,
                        'supplier_name' => $comm->supplier_name,
                        'communication_type' => $comm->communication_type,
                        'subject' => $comm->subject,
                        'message' => $comm->message,
                        'response_required' => $comm->response_required,
                        'response_date' => $comm->response_date,
                        'status' => $comm->status,
                        'priority' => $comm->priority,
                        'created_at' => $comm->created_at,
                        'created_by' => $comm->user
                    ];
                }),
                'vouchers' => $lead->vouchers->map(function ($voucher) {
                    return [
                        'id' => $voucher->id,
                        'voucher_number' => $voucher->voucher_number,
                        'voucher_type' => $voucher->voucher_type,
                        'title' => $voucher->title,
                        'description' => $voucher->description,
                        'travel_date' => $voucher->travel_date,
                        'return_date' => $voucher->return_date,
                        'pax_count' => $voucher->pax_count,
                        'status' => $voucher->status,
                        'sent_to_customer' => $voucher->sent_to_customer,
                        'confirmed_by_customer' => $voucher->confirmed_by_customer,
                        'created_at' => $voucher->created_at,
                        'created_by' => $voucher->creator
                    ];
                }),
                'documents' => $lead->documents->map(function ($document) {
                    return [
                        'id' => $document->id,
                        'document_type' => $document->document_type,
                        'document_category' => $document->document_category,
                        'title' => $document->title,
                        'description' => $document->description,
                        'file_name' => $document->file_name,
                        'file_path' => $document->file_path,
                        'file_size' => $document->file_size,
                        'is_verified' => $document->is_verified,
                        'is_required' => $document->is_required,
                        'expiry_date' => $document->expiry_date,
                        'status' => $document->status,
                        'access_level' => $document->access_level,
                        'created_at' => $document->created_at,
                        'uploaded_by' => $document->uploader
                    ];
                }),
                'invoices' => $lead->invoices->map(function ($invoice) {
                    return [
                        'id' => $invoice->id,
                        'invoice_number' => $invoice->invoice_number,
                        'invoice_date' => $invoice->invoice_date,
                        'due_date' => $invoice->due_date,
                        'subtotal' => $invoice->subtotal,
                        'tax_amount' => $invoice->tax_amount,
                        'discount_amount' => $invoice->discount_amount,
                        'total_amount' => $invoice->total_amount,
                        'paid_amount' => $invoice->paid_amount,
                        'balance_amount' => $invoice->balance_amount,
                        'currency' => $invoice->currency,
                        'status' => $invoice->status,
                        'payment_terms' => $invoice->payment_terms,
                        'sent_at' => $invoice->sent_at,
                        'created_at' => $invoice->created_at,
                        'items_count' => $invoice->items->count(),
                        'payments_count' => $invoice->payments->count()
                    ];
                }),
                'billing_summary' => $billingSummary,
                'activity_history' => $activityLogs,
                'statistics' => [
                    'total_proposals' => $lead->proposals->count(),
                    'confirmed_proposals' => $lead->proposals->where('is_confirmed', true)->count(),
                    'total_followups' => $lead->followups->count(),
                    'pending_followups' => $lead->followups->where('is_completed', false)->count(),
                    'total_payments' => $lead->payments->count(),
                    'total_paid_amount' => $lead->payments->sum('paid_amount'),
                    'total_documents' => $lead->documents->count(),
                    'verified_documents' => $lead->documents->where('is_verified', true)->count(),
                    'total_invoices' => $lead->invoices->count(),
                    'paid_invoices' => $lead->invoices->where('status', 'paid')->count()
                ]
            ];

            return response()->json([
                'success' => true,
                'message' => 'Query details retrieved successfully',
                'data' => $response
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve query details',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Calculate billing summary
     *
     * @param Lead $lead
     * @return array
     */
    private function calculateBillingSummary(Lead $lead): array
    {
        $totalInvoiceAmount = $lead->invoices->sum('total_amount');
        $totalPaidAmount = $lead->payments->sum('paid_amount');
        $totalDueAmount = $totalInvoiceAmount - $totalPaidAmount;

        $billingRecords = $lead->billingRecords;
        $totalBillingAmount = $billingRecords->sum('amount');
        $paidBillingAmount = $billingRecords->where('payment_status', 'paid')->sum('amount');
        $pendingBillingAmount = $billingRecords->where('payment_status', 'pending')->sum('amount');

        return [
            'invoice_summary' => [
                'total_invoice_amount' => $totalInvoiceAmount,
                'total_paid_amount' => $totalPaidAmount,
                'total_due_amount' => $totalDueAmount,
                'payment_percentage' => $totalInvoiceAmount > 0 ? round(($totalPaidAmount / $totalInvoiceAmount) * 100, 2) : 0
            ],
            'billing_summary' => [
                'total_billing_amount' => $totalBillingAmount,
                'paid_billing_amount' => $paidBillingAmount,
                'pending_billing_amount' => $pendingBillingAmount,
                'overdue_amount' => $billingRecords->where('payment_status', 'overdue')->sum('amount')
            ],
            'payment_methods' => $lead->payments->groupBy('payment_method')->map(function ($payments, $method) {
                return [
                    'method' => $method,
                    'count' => $payments->count(),
                    'total_amount' => $payments->sum('paid_amount')
                ];
            })->values()
        ];
    }

    /**
     * Get activity history logs
     *
     * @param int $leadId
     * @return array
     */
    private function getActivityLogs(int $leadId): array
    {
        $activities = DB::table('activity_histories')
            ->leftJoin('users', 'activity_histories.user_id', '=', 'users.id')
            ->where('activity_histories.lead_id', $leadId)
            ->select([
                'activity_histories.*',
                'users.name as user_name',
                'users.email as user_email'
            ])
            ->orderBy('activity_histories.created_at', 'desc')
            ->limit(50)
            ->get();

        return $activities->map(function ($activity) {
            return [
                'id' => $activity->id,
                'activity_type' => $activity->activity_type,
                'activity_description' => $activity->activity_description,
                'module' => $activity->module,
                'record_id' => $activity->record_id,
                'old_values' => $activity->old_values ? json_decode($activity->old_values, true) : null,
                'new_values' => $activity->new_values ? json_decode($activity->new_values, true) : null,
                'ip_address' => $activity->ip_address,
                'user_agent' => $activity->user_agent,
                'created_at' => $activity->created_at,
                'user' => [
                    'id' => $activity->user_id,
                    'name' => $activity->user_name,
                    'email' => $activity->user_email
                ]
            ];
        })->toArray();
    }
}