<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\EmployeePerformanceLog;
use App\Models\EmployeeFinancialTransaction;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Payments\Domain\Entities\Payment;
use App\Modules\Hr\Domain\Entities\EmployeeTarget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;
use Barryvdh\DomPDF\Facade as PDF;

class EmployeeController extends Controller
{
    /**
     * Get comprehensive employee details.
     *
     * @param int $employeeId
     * @return JsonResponse
     */
    public function getEmployeeDetails($employeeId): JsonResponse
    {
        try {
            $employee = User::with(['company', 'branch', 'targets'])
                ->findOrFail($employeeId);

            // Get basic employee info
            $employeeDetails = [
                'id' => $employee->id,
                'name' => $employee->name,
                'email' => $employee->email,
                'phone' => $employee->phone,
                'is_active' => $employee->is_active,
                'last_login_at' => $employee->last_login_at,
                'created_at' => $employee->created_at,
                'user_type' => $employee->user_type,
                'company' => $employee->company ? $employee->company->name : null,
                'branch' => $employee->branch ? $employee->branch->name : null,
            ];

            // Get work assignment statistics
            $totalLeadsAssigned = Lead::where('assigned_to', $employeeId)->count();
            $activeLeads = Lead::where('assigned_to', $employeeId)
                ->whereIn('status', ['pending', 'follow_up', 'quoted'])
                ->count();
            $confirmedLeads = Lead::where('assigned_to', $employeeId)
                ->where('status', 'confirmed')
                ->count();
            $cancelledLeads = Lead::where('assigned_to', $employeeId)
                ->where('status', 'cancelled')
                ->count();

            // Get performance metrics
            $currentMonth = now()->format('Y-m');
            $currentTarget = EmployeeTarget::where('user_id', $employeeId)
                ->where('month', $currentMonth)
                ->first();

            // Get profit/loss from leads
            $totalRevenue = Payment::whereHas('lead', function($query) use ($employeeId) {
                $query->where('assigned_to', $employeeId)->where('status', 'confirmed');
            })->sum('amount');
            
            // Get current month performance
            $monthlyRevenue = Payment::whereHas('lead', function($query) use ($employeeId) {
                $query->where('assigned_to', $employeeId)
                    ->where('status', 'confirmed')
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year);
            })->sum('amount');

            return response()->json([
                'success' => true,
                'data' => [
                    'employee' => $employeeDetails,
                    'work_assignments' => [
                        'total_leads_assigned' => $totalLeadsAssigned,
                        'active_leads' => $activeLeads,
                        'confirmed_leads' => $confirmedLeads,
                        'cancelled_leads' => $cancelledLeads,
                    ],
                    'performance' => [
                        'current_month_target' => $currentTarget ? $currentTarget->target_amount : 0,
                        'current_month_achieved' => $currentTarget ? $currentTarget->achieved_amount : 0,
                        'total_revenue' => $totalRevenue,
                        'monthly_revenue' => $monthlyRevenue,
                        'success_rate' => $totalLeadsAssigned > 0 ? round(($confirmedLeads / $totalLeadsAssigned) * 100, 2) : 0,
                    ],
                    'registration_date' => $employee->created_at->format('Y-m-d H:i:s'),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching employee details',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get employee performance reports with different periods.
     *
     * @param Request $request
     * @param int $employeeId
     * @return JsonResponse
     */
    public function getEmployeeReports(Request $request, $employeeId): JsonResponse
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
            $employee = User::findOrFail($employeeId);

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

            // Get leads data for the period
            $leadsQuery = Lead::where('assigned_to', $employeeId)
                ->whereBetween('created_at', [$startDate, $endDate]);

            $totalLeads = $leadsQuery->count();
            $confirmedLeads = $leadsQuery->where('status', 'confirmed')->count();
            $cancelledLeads = $leadsQuery->where('status', 'cancelled')->count();
            $pendingLeads = $leadsQuery->whereIn('status', ['new', 'proposal', 'followup'])->count();

            // Get revenue from lead payments for confirmed leads
            $totalRevenue = Payment::whereHas('lead', function($query) use ($employeeId, $startDate, $endDate) {
                $query->where('assigned_to', $employeeId)
                    ->where('status', 'confirmed')
                    ->whereBetween('created_at', [$startDate, $endDate]);
            })->sum('amount');
            
            $averageLeadValue = $confirmedLeads > 0 ? $totalRevenue / $confirmedLeads : 0;

            // Get daily breakdown for charts
            $dailyData = Lead::where('assigned_to', $employeeId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('DATE(created_at) as date, COUNT(*) as total_leads, 
                    SUM(CASE WHEN status = "confirmed" THEN 1 ELSE 0 END) as confirmed_leads,
                    SUM(CASE WHEN status = "cancelled" THEN 1 ELSE 0 END) as cancelled_leads')
                ->groupBy('date')
                ->orderBy('date')
                ->get();

            // Add revenue data to daily breakdown
            foreach ($dailyData as $day) {
                $dayRevenue = Payment::whereHas('lead', function($query) use ($employeeId, $day) {
                    $query->where('assigned_to', $employeeId)
                        ->where('status', 'confirmed')
                        ->whereDate('created_at', $day->date);
                })->sum('amount');
                $day->revenue = $dayRevenue;
            }

            // Get targets for the period
            $targets = [];
            if ($period === 'monthly') {
                $months = [];
                $current = $startDate->copy();
                while ($current <= $endDate) {
                    $months[] = $current->format('Y-m');
                    $current->addMonth();
                }

                foreach ($months as $month) {
                    $target = EmployeeTarget::where('user_id', $employeeId)
                        ->where('month', $month)
                        ->first();
                    $targets[] = [
                        'month' => $month,
                        'target' => $target ? $target->target_amount : 0,
                        'achieved' => $target ? $target->achieved_amount : 0,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'employee' => [
                        'id' => $employee->id,
                        'name' => $employee->name,
                        'email' => $employee->email,
                    ],
                    'period' => $period,
                    'date_range' => [
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d'),
                    ],
                    'summary' => [
                        'total_leads' => $totalLeads,
                        'confirmed_leads' => $confirmedLeads,
                        'cancelled_leads' => $cancelledLeads,
                        'pending_leads' => $pendingLeads,
                        'success_rate' => $totalLeads > 0 ? round(($confirmedLeads / $totalLeads) * 100, 2) : 0,
                        'total_revenue' => round($totalRevenue, 2),
                        'average_lead_value' => round($averageLeadValue, 2),
                    ],
                    'daily_breakdown' => $dailyData,
                    'targets' => $targets,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating employee report',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Download employee report as PDF.
     *
     * @param Request $request
     * @param int $employeeId
     * @return \Illuminate\Http\Response
     */
    public function downloadEmployeeReportPDF(Request $request, $employeeId)
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

            // Get the same data as the report API
            $reportResponse = $this->getEmployeeReports($request, $employeeId);
            $reportData = json_decode($reportResponse->getContent(), true);

            if (!$reportData['success']) {
                return $reportResponse;
            }

            $data = $reportData['data'];

            // Generate PDF
            $pdf = PDF::loadView('pdf.employee-report', compact('data'));
            
            $filename = 'employee-report-' . $data['employee']['name'] . '-' . $data['period'] . '-' . now()->format('Y-m-d') . '.pdf';
            
            return $pdf->download($filename);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error generating PDF report',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get all employees list for selection.
     *
     * @return JsonResponse
     */
    public function getEmployeesList(): JsonResponse
    {
        try {
            $employees = User::where('is_active', true)
                ->select('id', 'name', 'email', 'phone', 'created_at')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $employees
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching employees list',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get employee profit/loss analysis.
     * Supports period: weekly, monthly, yearly (or custom start_date/end_date).
     * Includes dena (payables) and lena (receivables).
     *
     * @param Request $request
     * @param int $employeeId
     * @return JsonResponse
     */
    public function getEmployeeProfitLoss(Request $request, $employeeId): JsonResponse
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

            $employee = User::findOrFail($employeeId);
            $period = $request->input('period');
            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            if (!$startDate || !$endDate) {
                if ($period) {
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
                } else {
                    $startDate = now()->startOfMonth();
                    $endDate = now()->endOfMonth();
                }
            }

            $startDate = Carbon::parse($startDate);
            $endDate = Carbon::parse($endDate);

            // Get revenue from confirmed leads (dynamic - actual Payment data)
            $revenue = Payment::whereHas('lead', function($query) use ($employeeId, $startDate, $endDate) {
                $query->where('assigned_to', $employeeId)
                    ->where('status', 'confirmed')
                    ->whereBetween('created_at', [$startDate, $endDate]);
            })->sum('amount');

            // Dynamic lost revenue - actual value from quotation/invoice/budget per cancelled lead
            $cancelledLeads = Lead::where('assigned_to', $employeeId)
                ->where('status', 'cancelled')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();
            $lostRevenue = $cancelledLeads->sum(fn ($lead) => $lead->getEstimatedValue());

            // Dynamic pending revenue - actual value from quotation/invoice/budget per pending lead
            $pendingLeadsList = Lead::where('assigned_to', $employeeId)
                ->whereIn('status', ['new', 'proposal', 'followup'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();
            $pendingRevenue = $pendingLeadsList->sum(fn ($lead) => $lead->getEstimatedValue());

            // Calculate conversion rates
            $totalLeads = Lead::where('assigned_to', $employeeId)
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();

            $confirmedLeads = Lead::where('assigned_to', $employeeId)
                ->where('status', 'confirmed')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->count();

            $cancelledLeadsCount = $cancelledLeads->count();

            $conversionRate = $totalLeads > 0 ? round(($confirmedLeads / $totalLeads) * 100, 2) : 0;
            $cancellationRate = $totalLeads > 0 ? round(($cancelledLeadsCount / $totalLeads) * 100, 2) : 0;

            // Dena & Lena (payables & receivables - total outstanding)
            $dena = round((float) EmployeeFinancialTransaction::where('user_id', $employeeId)
                ->where('type', EmployeeFinancialTransaction::TYPE_PAYABLE)
                ->whereIn('status', [EmployeeFinancialTransaction::STATUS_PENDING, EmployeeFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn ($t) => $t->amount - $t->paid_amount), 2);
            $lena = round((float) EmployeeFinancialTransaction::where('user_id', $employeeId)
                ->where('type', EmployeeFinancialTransaction::TYPE_RECEIVABLE)
                ->whereIn('status', [EmployeeFinancialTransaction::STATUS_PENDING, EmployeeFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn ($t) => $t->amount - $t->paid_amount), 2);

            return response()->json([
                'success' => true,
                'data' => [
                    'employee' => [
                        'id' => $employee->id,
                        'name' => $employee->name,
                    ],
                    'period' => $period ?? 'custom',
                    'date_range' => [
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d'),
                    ],
                    'revenue_analysis' => [
                        'actual_revenue' => round($revenue, 2),
                        'lost_revenue' => round($lostRevenue, 2),
                        'pending_revenue' => round($pendingRevenue, 2),
                        'total_potential' => round($revenue + $lostRevenue + $pendingRevenue, 2),
                    ],
                    'performance_metrics' => [
                        'total_leads' => $totalLeads,
                        'confirmed_leads' => $confirmedLeads,
                        'cancelled_leads' => $cancelledLeadsCount,
                        'conversion_rate' => $conversionRate,
                        'cancellation_rate' => $cancellationRate,
                        'average_lead_value' => $confirmedLeads > 0 ? round($revenue / $confirmedLeads, 2) : 0,
                    ],
                    'profit_loss' => [
                        'net_profit' => round($revenue, 2),
                        'profit_margin' => ($revenue + $lostRevenue) > 0 ? round(($revenue / ($revenue + $lostRevenue)) * 100, 2) : 0,
                    ],
                    'payables_receivables' => [
                        'dena' => $dena,
                        'lena' => $lena,
                        'kitna_dena' => $dena,
                        'kitna_lena' => $lena,
                        'balance' => round($lena - $dena, 2),
                    ],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error calculating profit/loss analysis',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get employee performance history.
     *
     * @param Request $request
     * @param int $employeeId
     * @return JsonResponse
     */
    public function getPerformanceHistory(Request $request, $employeeId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'period' => 'required|in:daily,weekly,monthly',
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

            $employee = User::findOrFail($employeeId);
            $period = $request->input('period');
            $startDate = $request->input('start_date', now()->subDays(30));
            $endDate = $request->input('end_date', now());

            $startDate = Carbon::parse($startDate);
            $endDate = Carbon::parse($endDate);

            // Get performance logs for the period
            $logsQuery = EmployeePerformanceLog::where('user_id', $employeeId)
                ->whereBetween('date', [$startDate, $endDate])
                ->orderBy('date');

            $performanceData = [];

            if ($period === 'daily') {
                $logs = $logsQuery->get();
                foreach ($logs as $log) {
                    $performanceData[] = [
                        'date' => $log->date->format('Y-m-d'),
                        'leads_assigned' => $log->leads_assigned,
                        'leads_confirmed' => $log->leads_confirmed,
                        'leads_cancelled' => $log->leads_cancelled,
                        'revenue_generated' => round($log->revenue_generated, 2),
                        'success_rate' => $log->success_rate,
                        'cancellation_rate' => $log->cancellation_rate,
                        'target_amount' => round($log->target_amount, 2),
                        'achievement_percentage' => $log->achievement_percentage,
                    ];
                }
            } elseif ($period === 'weekly') {
                $logs = $logsQuery->get();
                $weeklyData = [];
                
                foreach ($logs as $log) {
                    $weekKey = $log->date->format('Y-W');
                    if (!isset($weeklyData[$weekKey])) {
                        $weeklyData[$weekKey] = [
                            'week_start' => $log->date->startOfWeek()->format('Y-m-d'),
                            'week_end' => $log->date->endOfWeek()->format('Y-m-d'),
                            'leads_assigned' => 0,
                            'leads_confirmed' => 0,
                            'leads_cancelled' => 0,
                            'revenue_generated' => 0,
                            'target_amount' => 0,
                            'achievement_amount' => 0,
                        ];
                    }
                    
                    $weeklyData[$weekKey]['leads_assigned'] += $log->leads_assigned;
                    $weeklyData[$weekKey]['leads_confirmed'] += $log->leads_confirmed;
                    $weeklyData[$weekKey]['leads_cancelled'] += $log->leads_cancelled;
                    $weeklyData[$weekKey]['revenue_generated'] += $log->revenue_generated;
                    $weeklyData[$weekKey]['target_amount'] += $log->target_amount;
                    $weeklyData[$weekKey]['achievement_amount'] += $log->achievement_amount;
                }
                
                foreach ($weeklyData as $week) {
                    $totalLeads = $week['leads_assigned'];
                    $performanceData[] = [
                        'period' => $week['week_start'] . ' to ' . $week['week_end'],
                        'leads_assigned' => $week['leads_assigned'],
                        'leads_confirmed' => $week['leads_confirmed'],
                        'leads_cancelled' => $week['leads_cancelled'],
                        'revenue_generated' => round($week['revenue_generated'], 2),
                        'success_rate' => $totalLeads > 0 ? round(($week['leads_confirmed'] / $totalLeads) * 100, 2) : 0,
                        'cancellation_rate' => $totalLeads > 0 ? round(($week['leads_cancelled'] / $totalLeads) * 100, 2) : 0,
                        'target_amount' => round($week['target_amount'], 2),
                        'achievement_percentage' => $week['target_amount'] > 0 ? round(($week['achievement_amount'] / $week['target_amount']) * 100, 2) : 0,
                    ];
                }
            } elseif ($period === 'monthly') {
                $logs = $logsQuery->get();
                $monthlyData = [];
                
                foreach ($logs as $log) {
                    $monthKey = $log->date->format('Y-m');
                    if (!isset($monthlyData[$monthKey])) {
                        $monthlyData[$monthKey] = [
                            'month' => $log->date->format('Y-m'),
                            'leads_assigned' => 0,
                            'leads_confirmed' => 0,
                            'leads_cancelled' => 0,
                            'revenue_generated' => 0,
                            'target_amount' => 0,
                            'achievement_amount' => 0,
                        ];
                    }
                    
                    $monthlyData[$monthKey]['leads_assigned'] += $log->leads_assigned;
                    $monthlyData[$monthKey]['leads_confirmed'] += $log->leads_confirmed;
                    $monthlyData[$monthKey]['leads_cancelled'] += $log->leads_cancelled;
                    $monthlyData[$monthKey]['revenue_generated'] += $log->revenue_generated;
                    $monthlyData[$monthKey]['target_amount'] += $log->target_amount;
                    $monthlyData[$monthKey]['achievement_amount'] += $log->achievement_amount;
                }
                
                foreach ($monthlyData as $month) {
                    $totalLeads = $month['leads_assigned'];
                    $performanceData[] = [
                        'period' => date('F Y', strtotime($month['month'] . '-01')),
                        'leads_assigned' => $month['leads_assigned'],
                        'leads_confirmed' => $month['leads_confirmed'],
                        'leads_cancelled' => $month['leads_cancelled'],
                        'revenue_generated' => round($month['revenue_generated'], 2),
                        'success_rate' => $totalLeads > 0 ? round(($month['leads_confirmed'] / $totalLeads) * 100, 2) : 0,
                        'cancellation_rate' => $totalLeads > 0 ? round(($month['leads_cancelled'] / $totalLeads) * 100, 2) : 0,
                        'target_amount' => round($month['target_amount'], 2),
                        'achievement_percentage' => $month['target_amount'] > 0 ? round(($month['achievement_amount'] / $month['target_amount']) * 100, 2) : 0,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'employee' => [
                        'id' => $employee->id,
                        'name' => $employee->name,
                    ],
                    'period' => $period,
                    'date_range' => [
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d'),
                    ],
                    'performance_history' => $performanceData,
                    'summary' => [
                        'total_periods' => count($performanceData),
                        'total_leads_assigned' => array_sum(array_column($performanceData, 'leads_assigned')),
                        'total_leads_confirmed' => array_sum(array_column($performanceData, 'leads_confirmed')),
                        'total_leads_cancelled' => array_sum(array_column($performanceData, 'leads_cancelled')),
                        'total_revenue' => round(array_sum(array_column($performanceData, 'revenue_generated')), 2),
                        'average_success_rate' => count($performanceData) > 0 ? round(array_sum(array_column($performanceData, 'success_rate')) / count($performanceData), 2) : 0,
                    ]
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching performance history',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get comprehensive employee financial summary (Part 1 - Full).
     * Profit, Loss, Dena (payables), Lena (receivables) - Weekly/Monthly/Yearly.
     *
     * @param Request $request
     * @param int $employeeId
     * @return JsonResponse
     */
    public function getEmployeeFinancialSummary(Request $request, $employeeId): JsonResponse
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
            $employee = User::findOrFail($employeeId);

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

            // 1. PROFIT - Dynamic: Revenue from confirmed leads (actual Payment data)
            $revenue = Payment::whereHas('lead', function ($query) use ($employeeId, $startDate, $endDate) {
                $query->where('assigned_to', $employeeId)
                    ->where('status', 'confirmed')
                    ->whereBetween('created_at', [$startDate, $endDate]);
            })->sum('amount');
            $profit = round((float) $revenue, 2);

            // 2. LOSS - Dynamic: Actual value per cancelled lead (quotation/invoice/budget from DB)
            $cancelledLeads = Lead::where('assigned_to', $employeeId)
                ->where('status', 'cancelled')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();
            $loss = round($cancelledLeads->sum(fn ($lead) => $lead->getEstimatedValue()), 2);

            // 3. DENA (Payables) - Company owes to employee - Kitna dena (total outstanding)
            $dena = round((float) EmployeeFinancialTransaction::where('user_id', $employeeId)
                ->where('type', EmployeeFinancialTransaction::TYPE_PAYABLE)
                ->whereIn('status', [EmployeeFinancialTransaction::STATUS_PENDING, EmployeeFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn ($t) => $t->amount - $t->paid_amount), 2);

            // 4. LENA (Receivables) - Employee owes to company - Kitna lena (total outstanding)
            $lena = round((float) EmployeeFinancialTransaction::where('user_id', $employeeId)
                ->where('type', EmployeeFinancialTransaction::TYPE_RECEIVABLE)
                ->whereIn('status', [EmployeeFinancialTransaction::STATUS_PENDING, EmployeeFinancialTransaction::STATUS_PARTIAL])
                ->get()
                ->sum(fn ($t) => $t->amount - $t->paid_amount), 2);

            return response()->json([
                'success' => true,
                'data' => [
                    'employee' => [
                        'id' => $employee->id,
                        'name' => $employee->name,
                        'email' => $employee->email,
                    ],
                    'period' => $period,
                    'date_range' => [
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d'),
                    ],
                    'financial_summary' => [
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
                'message' => 'Error fetching employee financial summary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Add employee payable (dena) or receivable (lena).
     *
     * @param Request $request
     * @param int $employeeId
     * @return JsonResponse
     */
    public function storeEmployeeFinancialTransaction(Request $request, $employeeId): JsonResponse
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

            $user = User::findOrFail($employeeId);

            $transaction = EmployeeFinancialTransaction::create([
                'company_id' => $request->user()->company_id,
                'user_id' => $employeeId,
                'type' => $request->type,
                'category' => $request->category ?? 'other',
                'amount' => (float) $request->amount,
                'paid_amount' => 0,
                'lead_id' => $request->lead_id,
                'transaction_date' => $request->transaction_date,
                'due_date' => $request->due_date,
                'status' => EmployeeFinancialTransaction::STATUS_PENDING,
                'description' => $request->description,
                'created_by' => $request->user()->id,
            ]);

            $transaction->load(['employee:id,name,email', 'lead:id,client_name']);

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
                        'employee' => $transaction->employee ? ['id' => $transaction->employee->id, 'name' => $transaction->employee->name] : null,
                        'lead' => $transaction->lead ? ['id' => $transaction->lead->id, 'client_name' => $transaction->lead->client_name] : null,
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
     * Get employee financial transactions (payables & receivables) list.
     *
     * @param Request $request
     * @param int $employeeId
     * @return JsonResponse
     */
    public function getEmployeeFinancialTransactions(Request $request, $employeeId): JsonResponse
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

            $query = EmployeeFinancialTransaction::where('user_id', $employeeId)
                ->with(['lead:id,client_name', 'creator:id,name'])
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

            $employee = User::find($employeeId);

            return response()->json([
                'success' => true,
                'data' => [
                    'employee' => $employee ? ['id' => $employee->id, 'name' => $employee->name] : null,
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
     * Record payment/settlement for an employee financial transaction.
     *
     * @param Request $request
     * @param int $employeeId
     * @param int $transactionId
     * @return JsonResponse
     */
    public function recordEmployeeTransactionPayment(Request $request, $employeeId, $transactionId): JsonResponse
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

            $transaction = EmployeeFinancialTransaction::where('user_id', $employeeId)->findOrFail($transactionId);
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

            $transaction->load(['employee:id,name,email']);

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
