<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\Company;
use App\Models\EmailCampaign;
use App\Models\SmsCampaign;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics.
     */
    public function index(): JsonResponse
    {
        try {
            $user = Auth::user();
            $companyId = $user->company_id;

            // Get statistics with company filtering
            $stats = [
                'total_leads' => Lead::where('company_id', $companyId)->count(),
                'new_leads' => Lead::where('company_id', $companyId)->where('status', 'new')->count(),
                'hot_leads' => Lead::where('company_id', $companyId)->where('priority', 'hot')->count(),
                'confirmed_leads' => Lead::where('company_id', $companyId)->where('status', 'confirmed')->count(),
                'this_month_leads' => Lead::where('company_id', $companyId)
                    ->whereMonth('created_at', date('Y-m'))
                    ->count(),
                'total_campaigns' => EmailCampaign::where('company_id', $companyId)->count() +
                    SmsCampaign::where('company_id', $companyId)->count(),
                'active_campaigns' => EmailCampaign::where('company_id', $companyId)->where('status', 'active')->count() +
                    SmsCampaign::where('company_id', $companyId)->where('status', 'active')->count(),
                'total_users' => User::where('company_id', $companyId)->count(),
                'active_users' => User::where('company_id', $companyId)->where('is_active', true)->count(),
                'revenue_this_month' => $this->getMonthlyRevenue($companyId),
                'conversion_rate' => $this->getConversionRate($companyId),
                'top_performer' => $this->getTopPerformer($companyId),
                'recent_activities' => $this->getRecentActivities($companyId),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Dashboard statistics retrieved successfully',
                'data' => $stats,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Dashboard Error', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'company_id' => Auth::user()?->company_id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve dashboard statistics',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                'code' => 'DASHBOARD_ERROR'
            ], 500);
        }
    }

    /**
     * Get monthly revenue for the company.
     */
    private function getMonthlyRevenue($companyId): float
    {
        try {
            // This would typically come from payments table
            // For now, we'll return a calculated value based on confirmed leads
            $confirmedLeadsCount = Lead::where('company_id', $companyId)
                ->where('status', 'confirmed')
                ->whereMonth('created_at', date('Y-m'))
                ->count();

            // Average revenue per confirmed lead (adjust based on your business model)
            $avgRevenuePerLead = 1500; // Adjust this value based on your actual business

            return $confirmedLeadsCount * $avgRevenuePerLead;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get conversion rate for the company.
     */
    private function getConversionRate($companyId): float
    {
        try {
            $totalLeads = Lead::where('company_id', $companyId)->count();
            $confirmedLeads = Lead::where('company_id', $companyId)->where('status', 'confirmed')->count();

            if ($totalLeads > 0) {
                return round(($confirmedLeads / $totalLeads) * 100, 2);
            }

            return 0;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Get top performer for the company.
     */
    private function getTopPerformer($companyId): ?array
    {
        try {
            $topPerformer = DB::table('leads')
                ->select('assigned_to', DB::raw('count(*) as lead_count'))
                ->where('company_id', $companyId)
                ->whereNotNull('assigned_to')
                ->groupBy('assigned_to')
                ->orderBy('lead_count', 'desc')
                ->first();

            if ($topPerformer) {
                $user = User::find($topPerformer->assigned_to);
                return [
                    'name' => $user ? $user->name : 'Unknown',
                    'lead_count' => $topPerformer->lead_count
                ];
            }

            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Get recent activities for the company.
     */
    private function getRecentActivities($companyId): array
    {
        try {
            $recentLeads = Lead::where('company_id', $companyId)
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(['id', 'client_name', 'status', 'created_at', 'assigned_to']);

            $activities = [];
            foreach ($recentLeads as $lead) {
                $assignedUser = $lead->assigned_to ? User::find($lead->assigned_to) : null;
                $activities[] = [
                    'type' => 'lead_created',
                    'description' => "New lead created: {$lead->client_name}",
                    'created_at' => $lead->created_at,
                    'user' => $assignedUser ? $assignedUser->name : 'Unassigned'
                ];
            }

            return $activities;
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * Get leads by status for chart.
     */
    public function getLeadsByStatus(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $companyId = $user->company_id;

            $leadsByStatus = Lead::where('company_id', $companyId)
                ->selectRaw('status, COUNT(*) as count')
                ->groupBy('status')
                ->pluck('count', 'status')
                ->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Leads by status retrieved successfully',
                'data' => $leadsByStatus,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Leads by Status Error', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'company_id' => Auth::user()?->company_id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve leads by status',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                'code' => 'LEADS_STATUS_ERROR'
            ], 500);
        }
    }

    /**
     * Get revenue data for chart.
     */
    public function getRevenueData(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $companyId = $user->company_id;

            $revenueData = DB::table('leads')
                ->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as month, COUNT(*) as leads, SUM(CASE WHEN status = "confirmed" THEN 1500 ELSE 0 END) as revenue')
                ->where('company_id', $companyId)
                ->where('created_at', '>=', now()->subMonths(11))
                ->groupBy('month')
                ->orderBy('month')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Revenue data retrieved successfully',
                'data' => $revenueData,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Revenue Data Error', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'company_id' => Auth::user()?->company_id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve revenue data',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                'code' => 'REVENUE_DATA_ERROR'
            ], 500);
        }
    }

    /**
     * Get user performance data.
     */
    public function getUserPerformance(Request $request): JsonResponse
    {
        try {
            $user = Auth::user();
            $companyId = $user->company_id;

            $userPerformance = DB::table('leads')
                ->select('users.name', DB::raw('COUNT(*) as lead_count'))
                ->join('users', 'users.id', '=', 'leads.assigned_to')
                ->where('leads.company_id', $companyId)
                ->whereNotNull('leads.assigned_to')
                ->groupBy('users.id', 'users.name')
                ->orderBy('lead_count', 'desc')
                ->limit(10)
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'User performance data retrieved successfully',
                'data' => $userPerformance,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('User Performance Error', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'company_id' => Auth::user()?->company_id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user performance data',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
                'code' => 'USER_PERFORMANCE_ERROR'
            ], 500);
        }
    }
}
