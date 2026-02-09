<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\LeadSupplierCost;
use App\Models\SupplierFinancialTransaction;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Payments\Domain\Entities\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class SupplierFinancialController extends Controller
{
    /**
     * Get supplier financial summary (Part 2).
     * Profit, Loss, Dena (payables), Lena (receivables) - Weekly/Monthly/Yearly.
     */
    public function getSupplierFinancialSummary(Request $request, $supplierId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'period' => 'required|in:weekly,monthly,yearly',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $period = $request->input('period');
            $supplier = Supplier::findOrFail($supplierId);

            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            if (!$startDate || !$endDate) {
                switch ($period) {
                    case 'weekly':
                        $startDate = now()->startOfWeek();
                        $endDate = now()->endOfWeek();
                        break;
                    case 'monthly':
                        $startDate = now()->startOfMonth();
                        $endDate = now()->endOfMonth();
                        break;
                    case 'yearly':
                        $startDate = now()->startOfYear();
                        $endDate = now()->endOfYear();
                        break;
                }
            }

            $startDate = Carbon::parse($startDate);
            $endDate = Carbon::parse($endDate);

            // Lead IDs that used this supplier (from lead_supplier_costs) in period
            $leadIds = LeadSupplierCost::where('supplier_id', $supplierId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->pluck('lead_id')
                ->unique()
                ->values();

            // 1. COST - Dynamic: Total cost to this supplier for leads in period
            $cost = (float) LeadSupplierCost::where('supplier_id', $supplierId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->sum('cost_amount');

            // 2. REVENUE - Dynamic: Payments from leads that used this supplier
            $revenue = (float) Payment::whereIn('lead_id', $leadIds)
                ->whereHas('lead', fn ($q) => $q->where('status', 'confirmed'))
                ->sum('amount');

            // 3. PROFIT - Revenue - Cost
            $profit = round($revenue - $cost, 2);

            // 4. LOSS - Dynamic: Lost revenue from cancelled leads that used this supplier
            $cancelledLeads = Lead::whereIn('id', $leadIds)
                ->where('status', 'cancelled')
                ->get();
            $loss = round($cancelledLeads->sum(fn ($lead) => $lead->getEstimatedValue()), 2);

            // 5. DENA - Total outstanding payables (kitna dena)
            $dena = round((float) SupplierFinancialTransaction::where('supplier_id', $supplierId)
                ->where('type', SupplierFinancialTransaction::TYPE_PAYABLE)
                ->whereIn('status', [SupplierFinancialTransaction::STATUS_PENDING, SupplierFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn ($t) => $t->amount - $t->paid_amount), 2);

            // 6. LENA - Total outstanding receivables (kitna lena)
            $lena = round((float) SupplierFinancialTransaction::where('supplier_id', $supplierId)
                ->where('type', SupplierFinancialTransaction::TYPE_RECEIVABLE)
                ->whereIn('status', [SupplierFinancialTransaction::STATUS_PENDING, SupplierFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn ($t) => $t->amount - $t->paid_amount), 2);

            return response()->json([
                'success' => true,
                'data' => [
                    'supplier' => [
                        'id' => $supplier->id,
                        'name' => $supplier->name,
                        'company_name' => $supplier->company_name,
                        'email' => $supplier->email,
                    ],
                    'period' => $period,
                    'date_range' => [
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d'),
                    ],
                    'financial_summary' => [
                        'revenue' => round($revenue, 2),
                        'cost' => round($cost, 2),
                        'profit' => $profit,
                        'loss' => $loss,
                        'net_profit' => round($profit - $loss, 2),
                        'dena' => $dena,
                        'lena' => $lena,
                        'summary' => [
                            'kitna_dena' => $dena,
                            'kitna_lena' => $lena,
                            'balance' => round($lena - $dena, 2),
                        ],
                    ],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching supplier financial summary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Add lead-supplier cost (cost for this supplier for a lead).
     */
    public function storeLeadSupplierCost(Request $request, $supplierId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'lead_id' => 'required|exists:leads,id',
                'cost_amount' => 'required|numeric|min:0.01',
                'service_type' => 'nullable|string|max:50',
                'transaction_date' => 'required|date',
                'description' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            Supplier::findOrFail($supplierId);

            $cost = LeadSupplierCost::create([
                'company_id' => $request->user()->company_id,
                'lead_id' => $request->lead_id,
                'supplier_id' => $supplierId,
                'cost_amount' => (float) $request->cost_amount,
                'service_type' => $request->service_type,
                'transaction_date' => $request->transaction_date,
                'description' => $request->description,
                'created_by' => $request->user()->id,
            ]);

            $cost->load(['supplier', 'lead:id,client_name']);

            return response()->json([
                'success' => true,
                'message' => 'Lead supplier cost added successfully',
                'data' => [
                    'cost' => [
                        'id' => $cost->id,
                        'lead_id' => $cost->lead_id,
                        'supplier_id' => $cost->supplier_id,
                        'cost_amount' => $cost->cost_amount,
                        'service_type' => $cost->service_type,
                        'transaction_date' => $cost->transaction_date->format('Y-m-d'),
                        'description' => $cost->description,
                    ],
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error adding lead supplier cost',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Add supplier payable (dena) or receivable (lena).
     */
    public function storeSupplierFinancialTransaction(Request $request, $supplierId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'required|in:payable,receivable',
                'category' => 'nullable|string|max:50',
                'amount' => 'required|numeric|min:0.01',
                'lead_id' => 'nullable|exists:leads,id',
                'transaction_date' => 'required|date',
                'due_date' => 'nullable|date',
                'description' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            Supplier::findOrFail($supplierId);

            $transaction = SupplierFinancialTransaction::create([
                'company_id' => $request->user()->company_id,
                'supplier_id' => $supplierId,
                'type' => $request->type,
                'category' => $request->category ?? 'other',
                'amount' => (float) $request->amount,
                'paid_amount' => 0,
                'lead_id' => $request->lead_id,
                'transaction_date' => $request->transaction_date,
                'due_date' => $request->due_date,
                'status' => SupplierFinancialTransaction::STATUS_PENDING,
                'description' => $request->description,
                'created_by' => $request->user()->id,
            ]);

            $transaction->load(['supplier', 'lead:id,client_name']);

            return response()->json([
                'success' => true,
                'message' => $request->type === 'payable' ? 'Payable added successfully' : 'Receivable added successfully',
                'data' => [
                    'transaction' => [
                        'id' => $transaction->id,
                        'type' => $transaction->type,
                        'category' => $transaction->category,
                        'amount' => $transaction->amount,
                        'paid_amount' => $transaction->paid_amount,
                        'outstanding' => $transaction->outstanding_amount,
                        'transaction_date' => $transaction->transaction_date->format('Y-m-d'),
                        'due_date' => $transaction->due_date?->format('Y-m-d'),
                        'status' => $transaction->status,
                        'description' => $transaction->description,
                        'supplier' => $transaction->supplier ? ['id' => $transaction->supplier->id, 'name' => $transaction->supplier->name] : null,
                    ],
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error adding transaction',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get lead-supplier costs for a supplier.
     */
    public function getSupplierLeadCosts(Request $request, $supplierId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'period' => 'nullable|in:weekly,monthly,yearly',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = LeadSupplierCost::where('supplier_id', $supplierId)
                ->with(['lead:id,client_name,status'])
                ->orderBy('transaction_date', 'desc');

            $startDate = $request->start_date;
            $endDate = $request->end_date;
            if (!$startDate && $request->filled('period')) {
                switch ($request->period) {
                    case 'weekly':
                        $startDate = now()->startOfWeek();
                        $endDate = now()->endOfWeek();
                        break;
                    case 'monthly':
                        $startDate = now()->startOfMonth();
                        $endDate = now()->endOfMonth();
                        break;
                    case 'yearly':
                        $startDate = now()->startOfYear();
                        $endDate = now()->endOfYear();
                        break;
                }
            }
            if ($startDate && $endDate) {
                $query->whereBetween('transaction_date', [$startDate, $endDate]);
            }

            $costs = $query->get()->map(fn ($c) => [
                'id' => $c->id,
                'lead_id' => $c->lead_id,
                'lead' => $c->lead ? ['id' => $c->lead->id, 'client_name' => $c->lead->client_name, 'status' => $c->lead->status] : null,
                'cost_amount' => (float) $c->cost_amount,
                'service_type' => $c->service_type,
                'transaction_date' => $c->transaction_date->format('Y-m-d'),
                'description' => $c->description,
            ]);

            $supplier = Supplier::find($supplierId);

            return response()->json([
                'success' => true,
                'data' => [
                    'supplier' => $supplier ? ['id' => $supplier->id, 'name' => $supplier->name] : null,
                    'costs' => $costs,
                    'total_cost' => round($costs->sum(fn ($c) => $c['cost_amount']), 2),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching lead costs',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get supplier financial transactions list.
     */
    public function getSupplierFinancialTransactions(Request $request, $supplierId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'type' => 'nullable|in:payable,receivable',
                'status' => 'nullable|in:pending,partial,paid,settled',
                'period' => 'nullable|in:weekly,monthly,yearly',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = SupplierFinancialTransaction::where('supplier_id', $supplierId)
                ->with(['lead:id,client_name'])
                ->orderBy('transaction_date', 'desc')
                ->orderBy('created_at', 'desc');

            if ($request->filled('type')) {
                $query->where('type', $request->type);
            }
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            $startDate = $request->start_date;
            $endDate = $request->end_date;
            if (!$startDate && $request->filled('period')) {
                switch ($request->period) {
                    case 'weekly':
                        $startDate = now()->startOfWeek();
                        $endDate = now()->endOfWeek();
                        break;
                    case 'monthly':
                        $startDate = now()->startOfMonth();
                        $endDate = now()->endOfMonth();
                        break;
                    case 'yearly':
                        $startDate = now()->startOfYear();
                        $endDate = now()->endOfYear();
                        break;
                }
            }
            if ($startDate && $endDate) {
                $query->whereBetween('transaction_date', [$startDate, $endDate]);
            }

            $transactions = $query->get()->map(fn ($t) => [
                'id' => $t->id,
                'type' => $t->type,
                'category' => $t->category,
                'amount' => (float) $t->amount,
                'paid_amount' => (float) $t->paid_amount,
                'outstanding' => (float) ($t->amount - $t->paid_amount),
                'transaction_date' => $t->transaction_date->format('Y-m-d'),
                'due_date' => $t->due_date?->format('Y-m-d'),
                'status' => $t->status,
                'description' => $t->description,
                'lead' => $t->lead ? ['id' => $t->lead->id, 'client_name' => $t->lead->client_name] : null,
                'created_at' => $t->created_at->toIso8601String(),
            ]);

            $supplier = Supplier::find($supplierId);

            return response()->json([
                'success' => true,
                'data' => [
                    'supplier' => $supplier ? ['id' => $supplier->id, 'name' => $supplier->name] : null,
                    'transactions' => $transactions,
                    'summary' => [
                        'total_payable_outstanding' => round((float) $transactions->where('type', 'payable')->whereIn('status', ['pending', 'partial'])->sum('outstanding'), 2),
                        'total_receivable_outstanding' => round((float) $transactions->where('type', 'receivable')->whereIn('status', ['pending', 'partial'])->sum('outstanding'), 2),
                    ],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching transactions',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Record payment for supplier financial transaction.
     */
    public function recordSupplierTransactionPayment(Request $request, $supplierId, $transactionId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'paid_amount' => 'required|numeric|min:0.01',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $transaction = SupplierFinancialTransaction::where('supplier_id', $supplierId)->findOrFail($transactionId);
            $paidAmount = (float) $request->paid_amount;
            $outstanding = (float) ($transaction->amount - $transaction->paid_amount);

            if ($paidAmount > $outstanding) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paid amount cannot exceed outstanding amount (' . $outstanding . ')',
                ], 422);
            }

            $transaction->paid_amount += $paidAmount;
            $transaction->updateStatus();

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully',
                'data' => [
                    'transaction' => [
                        'id' => $transaction->id,
                        'type' => $transaction->type,
                        'amount' => $transaction->amount,
                        'paid_amount' => $transaction->paid_amount,
                        'outstanding' => (float) ($transaction->amount - $transaction->paid_amount),
                        'status' => $transaction->status,
                    ],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error recording payment',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
