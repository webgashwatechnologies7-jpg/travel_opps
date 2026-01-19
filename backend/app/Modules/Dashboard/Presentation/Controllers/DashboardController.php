<?php

namespace App\Modules\Dashboard\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Leads\Domain\Entities\LeadFollowup;
use App\Modules\Payments\Domain\Entities\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function stats(Request $request): JsonResponse
    {
        try {
            $today = now()->toDateString();
            $currentYear = now()->year;

            // Calculate statistics
            $calculateStats = function () use ($today, $currentYear) {
                // Basic statistics
                $todayQueries = Lead::whereDate('created_at', $today)->count();
                $totalQueries = Lead::count();
                $proposalSent = Lead::where('status', 'proposal')->count();
                $hotLeads = Lead::where('priority', 'hot')->count();
                $proposalConfirmed = Lead::where('status', 'confirmed')->whereHas('statusLogs', function ($query) {
                    $query->where('old_status', 'proposal')->where('new_status', 'confirmed');
                })->count();
                $cancelled = Lead::where('status', 'cancelled')->count();
                $followups = Lead::where('status', 'followup')->count();
                $confirmed = Lead::where('status', 'confirmed')->count();

                // Payment collection total
                $paymentCollectionTotal = Payment::sum('paid_amount') ?? 0;

                // Revenue growth monthly (last 12 months)
                $revenueGrowthMonthly = [];
                $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                
                for ($i = 11; $i >= 0; $i--) {
                    $date = now()->subMonths($i);
                    $monthStart = $date->copy()->startOfMonth();
                    $monthEnd = $date->copy()->endOfMonth();
                    
                    $amount = Payment::whereBetween('created_at', [$monthStart, $monthEnd])
                        ->sum('paid_amount') ?? 0;
                    
                    $revenueGrowthMonthly[] = [
                        'month' => $months[$date->month - 1],
                        'amount' => (float) $amount,
                    ];
                }

                // This year queries confirmed (monthly breakdown)
                $thisYearQueriesConfirmed = [];
                for ($month = 1; $month <= 12; $month++) {
                    $monthStart = now()->setYear($currentYear)->setMonth($month)->startOfMonth();
                    $monthEnd = now()->setYear($currentYear)->setMonth($month)->endOfMonth();
                    
                    $queries = Lead::whereBetween('created_at', [$monthStart, $monthEnd])->count();
                    $confirmedCount = Lead::whereBetween('created_at', [$monthStart, $monthEnd])
                        ->where('status', 'confirmed')
                        ->count();
                    
                    $thisYearQueriesConfirmed[] = [
                        'month' => $months[$month - 1],
                        'queries' => $queries,
                        'confirmed' => $confirmedCount,
                    ];
                }

                // Upcoming tours (confirmed leads with earliest payment due_date)
                $upcomingTours = Lead::where('status', 'confirmed')
                    ->with(['payments' => function ($query) {
                        $query->orderBy('due_date', 'asc');
                    }])
                    ->get()
                    ->map(function ($lead) {
                        $earliestPayment = $lead->payments->where('due_date', '!=', null)->first();
                        return [
                            'id' => $lead->id,
                            'client_name' => $lead->client_name,
                            'package_name' => $lead->destination ?? 'N/A',
                            'start_date' => $earliestPayment ? $earliestPayment->due_date->toDateString() : null,
                        ];
                    })
                    ->filter(function ($tour) use ($today) {
                        return $tour['start_date'] !== null && $tour['start_date'] >= $today;
                    })
                    ->sortBy('start_date')
                    ->take(10)
                    ->values()
                    ->toArray();

                // Latest query notes (from LeadFollowup remarks)
                $latestQueryNotes = LeadFollowup::with('lead')
                    ->whereNotNull('remark')
                    ->where('remark', '!=', '')
                    ->orderBy('created_at', 'desc')
                    ->take(10)
                    ->get()
                    ->map(function ($followup) {
                        return [
                            'lead_id' => $followup->lead_id,
                            'client_name' => $followup->lead ? $followup->lead->client_name : 'N/A',
                            'note' => $followup->remark,
                            'created_at' => $followup->created_at->toIso8601String(),
                        ];
                    })
                    ->toArray();

                // Sales reps (users with assigned leads)
                $salesReps = DB::table('users')
                    ->join('leads', 'users.id', '=', 'leads.assigned_to')
                    ->select(
                        'users.id as user_id',
                        'users.name',
                        DB::raw('COUNT(leads.id) as assigned'),
                        DB::raw("SUM(CASE WHEN leads.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed")
                    )
                    ->groupBy('users.id', 'users.name')
                    ->get()
                    ->map(function ($user) {
                        return [
                            'user_id' => $user->user_id,
                            'name' => $user->name,
                            'assigned' => (int) $user->assigned,
                            'confirmed' => (int) $user->confirmed,
                        ];
                    })
                    ->toArray();

                // Top lead sources
                $topLeadSources = Lead::select('source', DB::raw('COUNT(*) as total'))
                    ->selectRaw("SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed")
                    ->groupBy('source')
                    ->orderBy('total', 'desc')
                    ->take(10)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'source' => $item->source,
                            'total' => (int) $item->total,
                            'confirmed' => (int) $item->confirmed,
                        ];
                    })
                    ->toArray();

                // Top destinations
                $topDestinations = Lead::whereNotNull('destination')
                    ->select('destination', DB::raw('COUNT(*) as total'))
                    ->groupBy('destination')
                    ->orderBy('total', 'desc')
                    ->take(10)
                    ->get()
                    ->map(function ($item) {
                        return [
                            'destination' => $item->destination,
                            'total' => (int) $item->total,
                        ];
                    })
                    ->toArray();

                return [
                    'today_queries' => $todayQueries,
                    'total_queries' => $totalQueries,
                    'proposal_sent' => $proposalSent,
                    'hot_leads' => $hotLeads,
                    'proposal_confirmed' => $proposalConfirmed,
                    'cancelled' => $cancelled,
                    'followups' => $followups,
                    'confirmed' => $confirmed,
                    'payment_collection_total' => (float) $paymentCollectionTotal,
                    'revenue_growth_monthly' => $revenueGrowthMonthly,
                    'this_year_queries_confirmed' => $thisYearQueriesConfirmed,
                    'upcoming_tours' => $upcomingTours,
                    'latest_query_notes' => $latestQueryNotes,
                    'sales_reps' => $salesReps,
                    'top_lead_sources' => $topLeadSources,
                    'top_destinations' => $topDestinations,
                ];
            };

            // Use default cache (file) with 60-second TTL, fallback to array cache if fails
            try {
                $stats = Cache::remember('dashboard_stats', 60, $calculateStats);
            } catch (\Exception $e) {
                // Fallback to array cache if default cache fails
                try {
                    $stats = Cache::store('array')->remember('dashboard_stats', 60, $calculateStats);
                } catch (\Exception $e2) {
                    // If all caching fails, just calculate directly
                    $stats = $calculateStats();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Dashboard statistics retrieved successfully',
                'data' => $stats,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving dashboard statistics',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get revenue growth monthly for current year.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function getRevenueGrowthMonthly(Request $request): JsonResponse
    {
        try {
            $currentYear = now()->year;
            $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

            // Query lead_payments table grouped by month for current year
            $revenueData = DB::table('lead_payments')
                ->select(
                    DB::raw('MONTH(created_at) as month'),
                    DB::raw('SUM(paid_amount) as amount')
                )
                ->whereYear('created_at', $currentYear)
                ->groupBy(DB::raw('MONTH(created_at)'))
                ->orderBy('month', 'asc')
                ->get()
                ->mapWithKeys(function ($item) {
                    return [(int) $item->month => (float) $item->amount];
                })
                ->toArray();

            // Build result array with all months Jan-Dec
            $result = [];
            for ($month = 1; $month <= 12; $month++) {
                $result[] = [
                    'month' => $months[$month - 1],
                    'amount' => isset($revenueData[$month]) ? $revenueData[$month] : 0.0,
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Revenue growth monthly retrieved successfully',
                'data' => $result,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving revenue growth monthly',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get upcoming tours.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function upcomingTours(Request $request): JsonResponse
    {
        try {
            $today = now()->toDateString();

            // Query confirmed leads with travel_start_date >= today
            $upcomingTours = Lead::where('status', 'confirmed')
                ->where('travel_start_date', '>=', $today)
                ->whereNotNull('travel_start_date')
                ->orderBy('travel_start_date', 'asc')
                ->limit(5)
                ->select('client_name', 'destination', 'travel_start_date')
                ->get()
                ->map(function ($lead) {
                    return [
                        'client_name' => $lead->client_name,
                        'destination' => $lead->destination,
                        'travel_start_date' => $lead->travel_start_date ? $lead->travel_start_date->toDateString() : null,
                    ];
                })
                ->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Upcoming tours retrieved successfully',
                'data' => $upcomingTours,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving upcoming tours',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get latest lead notes.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function latestLeadNotes(Request $request): JsonResponse
    {
        try {
            // Query latest 10 lead notes with join to leads table
            $leadNotes = DB::table('lead_followups')
                ->join('leads', 'lead_followups.lead_id', '=', 'leads.id')
                ->select(
                    'lead_followups.lead_id',
                    'leads.client_name',
                    'lead_followups.remark as note',
                    'lead_followups.created_at'
                )
                ->whereNotNull('lead_followups.remark')
                ->where('lead_followups.remark', '!=', '')
                ->orderBy('lead_followups.created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function ($note) {
                    return [
                        'lead_id' => $note->lead_id,
                        'client_name' => $note->client_name,
                        'note' => $note->note,
                        'created_at' => \Carbon\Carbon::parse($note->created_at)->toIso8601String(),
                    ];
                })
                ->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Latest lead notes retrieved successfully',
                'data' => $leadNotes,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving latest lead notes',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get sales reps statistics.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function salesRepsStats(Request $request): JsonResponse
    {
        try {
            // Group leads by assigned_to and get statistics
            $salesReps = DB::table('leads')
                ->join('users', 'leads.assigned_to', '=', 'users.id')
                ->select(
                    'users.name',
                    DB::raw('COUNT(leads.id) as assigned'),
                    DB::raw("SUM(CASE WHEN leads.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed")
                )
                ->whereNotNull('leads.assigned_to')
                ->groupBy('leads.assigned_to', 'users.name')
                ->orderBy('assigned', 'desc')
                ->get()
                ->map(function ($rep) {
                    return [
                        'name' => $rep->name,
                        'assigned' => (int) $rep->assigned,
                        'confirmed' => (int) $rep->confirmed,
                    ];
                })
                ->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Sales reps statistics retrieved successfully',
                'data' => $salesReps,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving sales reps statistics',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get top destinations.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function topDestinations(Request $request): JsonResponse
    {
        try {
            // Group leads by destination where destination is not null
            $topDestinations = Lead::whereNotNull('destination')
                ->select('destination', DB::raw('COUNT(*) as total'))
                ->groupBy('destination')
                ->orderBy('total', 'desc')
                ->limit(7)
                ->get()
                ->map(function ($item) {
                    return [
                        'destination' => $item->destination,
                        'total' => (int) $item->total,
                    ];
                })
                ->toArray();

            return response()->json([
                'success' => true,
                'message' => 'Top destinations retrieved successfully',
                'data' => $topDestinations,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving top destinations',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

