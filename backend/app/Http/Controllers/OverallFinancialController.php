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
    /**
     * Part 5 - Overall financial summary.
     * Kitna dena hai, kitna lena hai - Weekly/Monthly/Yearly.
     */
    public function getOverallSummary(Request $request): JsonResponse
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

            // Total DENA - Company owes (payables)
            $employeePayables = (float) EmployeeFinancialTransaction::where('type', EmployeeFinancialTransaction::TYPE_PAYABLE)
                ->whereIn('status', [EmployeeFinancialTransaction::STATUS_PENDING, EmployeeFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn ($t) => $t->amount - $t->paid_amount);

            $supplierPayables = (float) SupplierFinancialTransaction::where('type', SupplierFinancialTransaction::TYPE_PAYABLE)
                ->whereIn('status', [SupplierFinancialTransaction::STATUS_PENDING, SupplierFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn ($t) => $t->amount - $t->paid_amount);

            $totalDena = round($employeePayables + $supplierPayables, 2);

            // Total LENA - Company to receive (receivables)
            $employeeReceivables = (float) EmployeeFinancialTransaction::where('type', EmployeeFinancialTransaction::TYPE_RECEIVABLE)
                ->whereIn('status', [EmployeeFinancialTransaction::STATUS_PENDING, EmployeeFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn ($t) => $t->amount - $t->paid_amount);

            $supplierReceivables = (float) SupplierFinancialTransaction::where('type', SupplierFinancialTransaction::TYPE_RECEIVABLE)
                ->whereIn('status', [SupplierFinancialTransaction::STATUS_PENDING, SupplierFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn ($t) => $t->amount - $t->paid_amount);

            // Client pending payments (kitna clients se lena hai)
            $clientPending = (float) Payment::whereIn('status', ['pending', 'partial'])
                ->get()
                ->sum(fn ($p) => $p->amount - $p->paid_amount);

            $totalLena = round($employeeReceivables + $supplierReceivables + $clientPending, 2);

            return response()->json([
                'success' => true,
                'data' => [
                    'period' => $period,
                    'date_range' => [
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d'),
                    ],
                    'summary' => [
                        'kitna_dena' => $totalDena,
                        'kitna_lena' => $totalLena,
                        'balance' => round($totalLena - $totalDena, 2),
                    ],
                    'breakdown' => [
                        'dena' => [
                            'employees' => round($employeePayables, 2),
                            'suppliers' => round($supplierPayables, 2),
                            'total' => $totalDena,
                        ],
                        'lena' => [
                            'employees' => round($employeeReceivables, 2),
                            'suppliers' => round($supplierReceivables, 2),
                            'clients_pending' => round($clientPending, 2),
                            'total' => $totalLena,
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
