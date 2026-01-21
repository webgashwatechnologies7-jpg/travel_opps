<?php

namespace App\Http\Controllers;

use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;

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
                'followups.user:id,name',
                'payments.creator:id,name',
                'queryProposals',
                'queryDocuments.uploader:id,name',
                'queryHistoryLogs.user:id,name,email'
            ])->findOrFail($id);

            // Calculate billing summary
            $billingSummary = $this->calculateBillingSummary($lead);

            // Get activity history logs
            $activityLogs = $this->getActivityLogs($lead);

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
                'proposals' => $lead->queryProposals->map(function ($proposal) {
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
                        'items_count' => 0,
                        'attachments_count' => 0,
                        'items' => [],
                        'attachments' => []
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
                'supplier_communications' => [],
                'vouchers' => [],
                'documents' => $lead->queryDocuments->map(function ($document) {
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
                'invoices' => [],
                'billing_summary' => $billingSummary,
                'activity_history' => $activityLogs,
                'statistics' => [
                    'total_proposals' => $lead->queryProposals->count(),
                    'confirmed_proposals' => $lead->queryProposals->where('is_confirmed', true)->count(),
                    'total_followups' => $lead->followups->count(),
                    'pending_followups' => $lead->followups->where('is_completed', false)->count(),
                    'total_payments' => $lead->payments->count(),
                    'total_paid_amount' => $lead->payments->sum('paid_amount'),
                    'total_documents' => $lead->queryDocuments->count(),
                    'verified_documents' => $lead->queryDocuments->where('is_verified', true)->count(),
                    'total_invoices' => 0,
                    'paid_invoices' => 0
                ]
            ];

            return response()->json([
                'success' => true,
                'message' => 'Query details retrieved successfully',
                'data' => $response
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Lead not found',
                'error' => 'Lead not found'
            ], 404);
        } catch (\Throwable $e) {
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
        $totalPaidAmount = $lead->payments->sum('paid_amount');
        $totalInvoiceAmount = 0;
        $totalDueAmount = 0;

        return [
            'invoice_summary' => [
                'total_invoice_amount' => $totalInvoiceAmount,
                'total_paid_amount' => $totalPaidAmount,
                'total_due_amount' => $totalDueAmount,
                'payment_percentage' => $totalInvoiceAmount > 0 ? round(($totalPaidAmount / $totalInvoiceAmount) * 100, 2) : 0
            ],
            'billing_summary' => [
                'total_billing_amount' => 0,
                'paid_billing_amount' => 0,
                'pending_billing_amount' => 0,
                'overdue_amount' => 0
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
    private function getActivityLogs(Lead $lead): array
    {
        return $lead->queryHistoryLogs->sortByDesc('created_at')->take(50)->map(function ($activity) {
            return [
                'id' => $activity->id,
                'activity_type' => $activity->activity_type,
                'activity_description' => $activity->activity_description,
                'module' => $activity->module,
                'record_id' => $activity->record_id,
                'old_values' => $activity->old_values,
                'new_values' => $activity->new_values,
                'ip_address' => $activity->ip_address,
                'user_agent' => $activity->user_agent,
                'created_at' => $activity->created_at,
                'user' => [
                    'id' => $activity->user?->id,
                    'name' => $activity->user?->name,
                    'email' => $activity->user?->email
                ]
            ];
        })->values()->toArray();
    }
}