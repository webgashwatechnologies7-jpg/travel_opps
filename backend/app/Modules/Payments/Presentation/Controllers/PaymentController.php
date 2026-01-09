<?php

namespace App\Modules\Payments\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Payments\Domain\Entities\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    /**
     * Create a new payment.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'lead_id' => 'required|exists:leads,id',
                'amount' => 'required|numeric|min:0',
                'paid_amount' => 'nullable|numeric|min:0',
                'due_date' => 'nullable|date',
            ], [
                'lead_id.required' => 'The lead_id field is required.',
                'lead_id.exists' => 'The selected lead does not exist.',
                'amount.required' => 'The amount field is required.',
                'amount.numeric' => 'The amount must be a number.',
                'amount.min' => 'The amount must be at least 0.',
                'paid_amount.numeric' => 'The paid_amount must be a number.',
                'paid_amount.min' => 'The paid_amount must be at least 0.',
                'due_date.date' => 'The due_date must be a valid date.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $amount = (float) $request->amount;
            $paidAmount = (float) ($request->paid_amount ?? 0);

            // Validate paid_amount doesn't exceed amount
            if ($paidAmount > $amount) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => [
                        'paid_amount' => ['Paid amount cannot exceed the total amount.'],
                    ],
                ], 422);
            }

            // Auto calculate status
            $status = Payment::calculateStatus($amount, $paidAmount);

            $payment = Payment::create([
                'lead_id' => $request->lead_id,
                'amount' => $amount,
                'paid_amount' => $paidAmount,
                'due_date' => $request->due_date,
                'status' => $status,
                'created_by' => $request->user()->id,
            ]);

            // Load lead relationship
            $payment->load(['lead.assignedUser', 'lead.creator', 'creator']);

            return response()->json([
                'success' => true,
                'message' => 'Payment created successfully',
                'data' => [
                    'payment' => [
                        'id' => $payment->id,
                        'lead_id' => $payment->lead_id,
                        'lead' => $payment->lead ? [
                            'id' => $payment->lead->id,
                            'client_name' => $payment->lead->client_name,
                            'email' => $payment->lead->email,
                            'phone' => $payment->lead->phone,
                            'source' => $payment->lead->source,
                            'destination' => $payment->lead->destination,
                            'status' => $payment->lead->status,
                            'priority' => $payment->lead->priority,
                            'assigned_to' => $payment->lead->assigned_to,
                            'assigned_user' => $payment->lead->assignedUser ? [
                                'id' => $payment->lead->assignedUser->id,
                                'name' => $payment->lead->assignedUser->name,
                                'email' => $payment->lead->assignedUser->email,
                            ] : null,
                        ] : null,
                        'amount' => $payment->amount,
                        'paid_amount' => $payment->paid_amount,
                        'due_date' => $payment->due_date,
                        'status' => $payment->status,
                        'created_by' => $payment->created_by,
                        'creator' => $payment->creator ? [
                            'id' => $payment->creator->id,
                            'name' => $payment->creator->name,
                            'email' => $payment->creator->email,
                        ] : null,
                        'created_at' => $payment->created_at,
                        'updated_at' => $payment->updated_at,
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating payment',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get payments due today.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function dueToday(Request $request): JsonResponse
    {
        try {
            $today = now()->toDateString();

            $payments = Payment::with(['lead.assignedUser', 'lead.creator', 'creator'])
                ->where('due_date', $today)
                ->where('status', '!=', 'paid')
                ->orderBy('due_date', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Payments due today retrieved successfully',
                'data' => [
                    'payments' => $payments->map(function ($payment) {
                        return [
                            'id' => $payment->id,
                            'lead_id' => $payment->lead_id,
                            'lead' => $payment->lead ? [
                                'id' => $payment->lead->id,
                                'client_name' => $payment->lead->client_name,
                                'email' => $payment->lead->email,
                                'phone' => $payment->lead->phone,
                                'source' => $payment->lead->source,
                                'destination' => $payment->lead->destination,
                                'status' => $payment->lead->status,
                                'priority' => $payment->lead->priority,
                                'assigned_to' => $payment->lead->assigned_to,
                                'assigned_user' => $payment->lead->assignedUser ? [
                                    'id' => $payment->lead->assignedUser->id,
                                    'name' => $payment->lead->assignedUser->name,
                                    'email' => $payment->lead->assignedUser->email,
                                ] : null,
                            ] : null,
                            'amount' => $payment->amount,
                            'paid_amount' => $payment->paid_amount,
                            'due_date' => $payment->due_date,
                            'status' => $payment->status,
                            'created_by' => $payment->created_by,
                            'creator' => $payment->creator ? [
                                'id' => $payment->creator->id,
                                'name' => $payment->creator->name,
                                'email' => $payment->creator->email,
                            ] : null,
                            'created_at' => $payment->created_at,
                        ];
                    }),
                    'count' => $payments->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving payments due today',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get pending payments (pending and partial status).
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function pending(Request $request): JsonResponse
    {
        try {
            $payments = Payment::with(['lead.assignedUser', 'lead.creator', 'creator'])
                ->whereIn('status', ['pending', 'partial'])
                ->orderBy('due_date', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Pending payments retrieved successfully',
                'data' => [
                    'payments' => $payments->map(function ($payment) {
                        return [
                            'id' => $payment->id,
                            'lead_id' => $payment->lead_id,
                            'lead' => $payment->lead ? [
                                'id' => $payment->lead->id,
                                'client_name' => $payment->lead->client_name,
                                'email' => $payment->lead->email,
                                'phone' => $payment->lead->phone,
                                'source' => $payment->lead->source,
                                'destination' => $payment->lead->destination,
                                'status' => $payment->lead->status,
                                'priority' => $payment->lead->priority,
                                'assigned_to' => $payment->lead->assigned_to,
                                'assigned_user' => $payment->lead->assignedUser ? [
                                    'id' => $payment->lead->assignedUser->id,
                                    'name' => $payment->lead->assignedUser->name,
                                    'email' => $payment->lead->assignedUser->email,
                                ] : null,
                            ] : null,
                            'amount' => $payment->amount,
                            'paid_amount' => $payment->paid_amount,
                            'due_date' => $payment->due_date,
                            'status' => $payment->status,
                            'created_by' => $payment->created_by,
                            'creator' => $payment->creator ? [
                                'id' => $payment->creator->id,
                                'name' => $payment->creator->name,
                                'email' => $payment->creator->email,
                            ] : null,
                            'created_at' => $payment->created_at,
                        ];
                    }),
                    'count' => $payments->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving pending payments',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get payments for a specific lead.
     *
     * @param int $leadId
     * @return JsonResponse
     */
    public function getByLead($leadId): JsonResponse
    {
        try {
            $payments = Payment::with(['creator'])
                ->where('lead_id', $leadId)
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Payments retrieved successfully',
                'data' => [
                    'payments' => $payments->map(function ($payment) {
                        return [
                            'id' => $payment->id,
                            'lead_id' => $payment->lead_id,
                            'amount' => $payment->amount,
                            'paid_amount' => $payment->paid_amount,
                            'due_amount' => $payment->amount - $payment->paid_amount,
                            'due_date' => $payment->due_date,
                            'status' => $payment->status,
                            'created_by' => $payment->created_by,
                            'creator' => $payment->creator ? [
                                'id' => $payment->creator->id,
                                'name' => $payment->creator->name,
                                'email' => $payment->creator->email,
                            ] : null,
                            'created_at' => $payment->created_at,
                            'updated_at' => $payment->updated_at,
                        ];
                    }),
                    'summary' => [
                        'total_amount' => $payments->sum('amount'),
                        'total_paid' => $payments->sum('paid_amount'),
                        'total_due' => $payments->sum(function ($payment) {
                            return $payment->amount - $payment->paid_amount;
                        }),
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving payments',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

