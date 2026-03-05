<?php

namespace App\Http\Controllers;

use App\Models\EmployeeFinancialTransaction;
use App\Models\SupplierFinancialTransaction;
use App\Modules\Payments\Domain\Entities\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class OverallFinancialController extends Controller
{
    use \App\Traits\FinancialPeriodTrait;

    /**
     * Part 5 - Overall financial summary.
     * Payables, Receivables - Weekly/Monthly/Yearly.
     */
    public function getOverallSummary(Request $request): JsonResponse
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

            list($startDate, $endDate) = $this->getPeriodDates($request);
            $period = $request->input('period', 'monthly');

            // Total PAYABLES - Company owes
            $employeePayables = (float) EmployeeFinancialTransaction::where('type', EmployeeFinancialTransaction::TYPE_PAYABLE)
                ->whereIn('status', [EmployeeFinancialTransaction::STATUS_PENDING, EmployeeFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn($t) => $t->amount - $t->paid_amount);

            $supplierPayables = (float) SupplierFinancialTransaction::where('type', SupplierFinancialTransaction::TYPE_PAYABLE)
                ->whereIn('status', [SupplierFinancialTransaction::STATUS_PENDING, SupplierFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn($t) => $t->amount - $t->paid_amount);

            $totalPayables = round($employeePayables + $supplierPayables, 2);

            // Total RECEIVABLES - Company to receive
            $employeeReceivables = (float) EmployeeFinancialTransaction::where('type', EmployeeFinancialTransaction::TYPE_RECEIVABLE)
                ->whereIn('status', [EmployeeFinancialTransaction::STATUS_PENDING, EmployeeFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn($t) => $t->amount - $t->paid_amount);

            $supplierReceivables = (float) SupplierFinancialTransaction::where('type', SupplierFinancialTransaction::TYPE_RECEIVABLE)
                ->whereIn('status', [SupplierFinancialTransaction::STATUS_PENDING, SupplierFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn($t) => $t->amount - $t->paid_amount);

            // Client pending payments
            $clientPending = (float) Payment::whereIn('status', ['pending', 'partial'])
                ->get()
                ->sum(fn($p) => $p->amount - $p->paid_amount);

            $totalReceivables = round($employeeReceivables + $supplierReceivables + $clientPending, 2);

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => $period,
                    'date_range' => [
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d'),
                    ],
                    'summary' => [
                        'payables' => $totalPayables,
                        'receivables' => $totalReceivables,
                        'balance' => round($totalReceivables - $totalPayables, 2),
                    ],
                    'breakdown' => [
                        'payables' => [
                            'employees' => round($employeePayables, 2),
                            'suppliers' => round($supplierPayables, 2),
                            'total' => $totalPayables,
                        ],
                        'receivables' => [
                            'employees' => round($employeeReceivables, 2),
                            'suppliers' => round($supplierReceivables, 2),
                            'clients_pending' => round($clientPending, 2),
                            'total' => $totalReceivables,
                        ],
                    ],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching overall financial summary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
