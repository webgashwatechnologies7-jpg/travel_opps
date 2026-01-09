<?php

namespace App\Modules\Dashboard\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Payments\Domain\Entities\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ReportsController extends Controller
{
    /**
     * Get sales summary report for a given month.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function salesSummary(Request $request): JsonResponse
    {
        try {
            // Validate the month parameter
            $validator = Validator::make($request->all(), [
                'month' => 'required|regex:/^\d{4}-\d{2}$/',
            ], [
                'month.required' => 'The month parameter is required.',
                'month.regex' => 'The month must be in YYYY-MM format (e.g., 2025-12).',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $month = $request->input('month');
            
            // Validate month format and extract year and month
            $monthParts = explode('-', $month);
            $year = (int) $monthParts[0];
            $monthNum = (int) $monthParts[1];

            if ($monthNum < 1 || $monthNum > 12) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid month. Month must be between 01 and 12.',
                ], 422);
            }

            // Get start and end dates for the month
            $startDate = \Carbon\Carbon::createFromDate($year, $monthNum, 1)->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();

            // Get lead statistics
            $leadStats = Lead::whereBetween('created_at', [$startDate, $endDate])
                ->selectRaw('COUNT(*) as total_leads')
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as confirmed_leads', ['confirmed'])
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled_leads', ['cancelled'])
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as new_leads', ['new'])
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as proposal_leads', ['proposal'])
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as followup_leads', ['followup'])
                ->first();

            // Get payment statistics
            $paymentStats = Payment::whereHas('lead', function ($query) use ($startDate, $endDate) {
                    $query->whereBetween('created_at', [$startDate, $endDate]);
                })
                ->selectRaw('SUM(amount) as total_revenue')
                ->selectRaw('SUM(paid_amount) as paid_revenue')
                ->selectRaw('COUNT(*) as total_payments')
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as paid_payments', ['paid'])
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as pending_payments', ['pending'])
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as partial_payments', ['partial'])
                ->first();

            $totalLeads = (int) $leadStats->total_leads;
            $confirmedLeads = (int) $leadStats->confirmed_leads;
            $conversionRate = $totalLeads > 0 
                ? round(($confirmedLeads / $totalLeads) * 100, 2) 
                : 0;

            return response()->json([
                'success' => true,
                'message' => 'Sales summary retrieved successfully',
                'data' => [
                    'month' => $month,
                    'leads' => [
                        'total' => $totalLeads,
                        'new' => (int) $leadStats->new_leads,
                        'proposal' => (int) $leadStats->proposal_leads,
                        'followup' => (int) $leadStats->followup_leads,
                        'confirmed' => $confirmedLeads,
                        'cancelled' => (int) $leadStats->cancelled_leads,
                        'conversion_rate' => $conversionRate,
                    ],
                    'revenue' => [
                        'total' => (float) ($paymentStats->total_revenue ?? 0),
                        'paid' => (float) ($paymentStats->paid_revenue ?? 0),
                        'pending' => (float) (($paymentStats->total_revenue ?? 0) - ($paymentStats->paid_revenue ?? 0)),
                    ],
                    'payments' => [
                        'total' => (int) ($paymentStats->total_payments ?? 0),
                        'paid' => (int) ($paymentStats->paid_payments ?? 0),
                        'partial' => (int) ($paymentStats->partial_payments ?? 0),
                        'pending' => (int) ($paymentStats->pending_payments ?? 0),
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving sales summary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get lead funnel report for a given month.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function leadFunnel(Request $request): JsonResponse
    {
        try {
            // Validate the month parameter
            $validator = Validator::make($request->all(), [
                'month' => 'required|regex:/^\d{4}-\d{2}$/',
            ], [
                'month.required' => 'The month parameter is required.',
                'month.regex' => 'The month must be in YYYY-MM format (e.g., 2025-12).',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $month = $request->input('month');
            
            // Validate month format and extract year and month
            $monthParts = explode('-', $month);
            $year = (int) $monthParts[0];
            $monthNum = (int) $monthParts[1];

            if ($monthNum < 1 || $monthNum > 12) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid month. Month must be between 01 and 12.',
                ], 422);
            }

            // Get start and end dates for the month
            $startDate = \Carbon\Carbon::createFromDate($year, $monthNum, 1)->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();

            // Group leads by status
            $funnelData = Lead::whereBetween('created_at', [$startDate, $endDate])
                ->select('status')
                ->selectRaw('COUNT(*) as count')
                ->groupBy('status')
                ->orderByRaw("FIELD(status, 'new', 'proposal', 'followup', 'confirmed', 'cancelled')")
                ->get()
                ->map(function ($item) {
                    return [
                        'status' => $item->status,
                        'count' => (int) $item->count,
                    ];
                });

            // Get total for percentage calculation
            $totalLeads = $funnelData->sum('count');

            // Add percentage to each status
            $funnelData = $funnelData->map(function ($item) use ($totalLeads) {
                $item['percentage'] = $totalLeads > 0 
                    ? round(($item['count'] / $totalLeads) * 100, 2) 
                    : 0;
                return $item;
            });

            return response()->json([
                'success' => true,
                'message' => 'Lead funnel retrieved successfully',
                'data' => [
                    'month' => $month,
                    'total_leads' => $totalLeads,
                    'funnel' => $funnelData,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving lead funnel',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get revenue by agent report for a given month.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function revenueByAgent(Request $request): JsonResponse
    {
        try {
            // Validate the month parameter
            $validator = Validator::make($request->all(), [
                'month' => 'required|regex:/^\d{4}-\d{2}$/',
            ], [
                'month.required' => 'The month parameter is required.',
                'month.regex' => 'The month must be in YYYY-MM format (e.g., 2025-12).',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $month = $request->input('month');
            
            // Validate month format and extract year and month
            $monthParts = explode('-', $month);
            $year = (int) $monthParts[0];
            $monthNum = (int) $monthParts[1];

            if ($monthNum < 1 || $monthNum > 12) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid month. Month must be between 01 and 12.',
                ], 422);
            }

            // Get start and end dates for the month
            $startDate = \Carbon\Carbon::createFromDate($year, $monthNum, 1)->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();

            // Get revenue grouped by assigned agent
            $revenueByAgent = Lead::whereBetween('created_at', [$startDate, $endDate])
                ->whereNotNull('assigned_to')
                ->with('assignedUser:id,name,email')
                ->select('assigned_to')
                ->selectRaw('COUNT(*) as total_leads')
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as confirmed_leads', ['confirmed'])
                ->groupBy('assigned_to')
                ->get()
                ->map(function ($leadGroup) use ($startDate, $endDate) {
                    // Get payment data for leads assigned to this agent
                    $payments = Payment::whereHas('lead', function ($query) use ($leadGroup, $startDate, $endDate) {
                            $query->where('assigned_to', $leadGroup->assigned_to)
                                  ->whereBetween('created_at', [$startDate, $endDate]);
                        })
                        ->selectRaw('SUM(amount) as total_revenue')
                        ->selectRaw('SUM(paid_amount) as paid_revenue')
                        ->first();

                    return [
                        'agent_id' => $leadGroup->assigned_to,
                        'agent_name' => $leadGroup->assignedUser->name ?? 'Unknown',
                        'agent_email' => $leadGroup->assignedUser->email ?? null,
                        'total_leads' => (int) $leadGroup->total_leads,
                        'confirmed_leads' => (int) $leadGroup->confirmed_leads,
                        'total_revenue' => (float) ($payments->total_revenue ?? 0),
                        'paid_revenue' => (float) ($payments->paid_revenue ?? 0),
                        'pending_revenue' => (float) (($payments->total_revenue ?? 0) - ($payments->paid_revenue ?? 0)),
                        'conversion_rate' => (int) $leadGroup->total_leads > 0 
                            ? round(((int) $leadGroup->confirmed_leads / (int) $leadGroup->total_leads) * 100, 2) 
                            : 0,
                    ];
                })
                ->sortByDesc('total_revenue')
                ->values();

            // Calculate totals
            $totalRevenue = $revenueByAgent->sum('total_revenue');
            $totalPaidRevenue = $revenueByAgent->sum('paid_revenue');

            return response()->json([
                'success' => true,
                'message' => 'Revenue by agent retrieved successfully',
                'data' => [
                    'month' => $month,
                    'agents' => $revenueByAgent,
                    'summary' => [
                        'total_agents' => $revenueByAgent->count(),
                        'total_revenue' => $totalRevenue,
                        'total_paid_revenue' => $totalPaidRevenue,
                        'total_pending_revenue' => $totalRevenue - $totalPaidRevenue,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving revenue by agent',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

