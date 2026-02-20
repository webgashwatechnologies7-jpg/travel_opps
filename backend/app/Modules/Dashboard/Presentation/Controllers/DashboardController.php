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
use Illuminate\Support\Facades\Auth;

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
            $currentUser = $request->user();
            $companyId = $currentUser->company_id;
            $today = now()->toDateString();
            $currentYear = now()->year;

            // Calculate statistics
            $calculateStats = function () use ($today, $currentYear, $companyId, $currentUser) {
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: Starting calculation');

                // ─── ONE combined query for all lead status counts ───────────────────
                $leadCounts = DB::table('leads')
                    ->where('company_id', $companyId)
                    ->selectRaw("
                        COUNT(*) as total_queries,
                        SUM(CASE WHEN DATE(created_at) = ? THEN 1 ELSE 0 END) as today_queries,
                        SUM(CASE WHEN status = 'proposal' THEN 1 ELSE 0 END) as proposal_sent,
                        SUM(CASE WHEN priority = 'hot' THEN 1 ELSE 0 END) as hot_leads,
                        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
                        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
                        SUM(CASE WHEN status = 'followup' THEN 1 ELSE 0 END) as followups
                    ", [$today])
                    ->first();
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: leadCounts calculated');

                // Confirmed with status log transition (keep as separate since it uses whereHas)
                $proposalConfirmed = Lead::withTrashed()->where('company_id', $companyId)
                    ->where('status', 'confirmed')
                    ->whereHas('statusLogs', function ($query) {
                        $query->where('old_status', 'proposal')->where('new_status', 'confirmed');
                    })->count();
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: proposalConfirmed calculated');

                // Payment collection — scoped to company
                $paymentCollectionTotal = DB::table('lead_payments')
                    ->join('leads', 'leads.id', '=', 'lead_payments.lead_id')
                    ->where('leads.company_id', $companyId)
                    ->sum('lead_payments.paid_amount') ?? 0;
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: paymentCollectionTotal calculated');

                // ─── Revenue growth: ONE query instead of 12 loop queries ────────────
                $months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                $rawRevenue = DB::table('lead_payments')
                    ->join('leads', 'leads.id', '=', 'lead_payments.lead_id')
                    ->where('leads.company_id', $companyId)
                    ->whereYear('lead_payments.created_at', now()->subYear()->year <= $currentYear ? $currentYear : $currentYear)
                    ->selectRaw('MONTH(lead_payments.created_at) as m, SUM(paid_amount) as amount')
                    ->groupBy('m')
                    ->pluck('amount', 'm')
                    ->toArray();

                $revenueGrowthMonthly = [];
                for ($i = 1; $i <= 12; $i++) {
                    $revenueGrowthMonthly[] = [
                        'month' => $months[$i - 1],
                        'amount' => (float) ($rawRevenue[$i] ?? 0),
                    ];
                }
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: revenueGrowthMonthly calculated');

                // ─── This year queries confirmed: ONE query instead of 24 queries ────
                $rawYearData = DB::table('leads')
                    ->where('company_id', $companyId)
                    ->whereYear('created_at', $currentYear)
                    ->selectRaw("
                        MONTH(created_at) as m,
                        COUNT(*) as queries,
                        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed_count
                    ")
                    ->groupBy('m')
                    ->get()
                    ->keyBy('m');

                $thisYearQueriesConfirmed = [];
                for ($month = 1; $month <= 12; $month++) {
                    $row = $rawYearData[$month] ?? null;

                    $thisYearQueriesConfirmed[] = [
                        'month' => $months[$month - 1],
                        'queries' => $row ? (int) $row->queries : 0,
                        'confirmed' => $row ? (int) $row->confirmed_count : 0,
                    ];
                }
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: thisYearQueriesConfirmed calculated');

                // Upcoming tours (confirmed leads with earliest payment due_date)
                $upcomingTours = Lead::withTrashed()->where('status', 'confirmed')
                    ->with([
                        'payments' => function ($query) {
                            $query->orderBy('due_date', 'asc');
                        }
                    ])
                    ->get()
                    ->map(function ($lead) {
                        try {
                            $earliestPayment = $lead->payments->where('due_date', '!=', null)->first();
                            return [
                                'id' => $lead->id,
                                'client_name' => $lead->client_name,
                                'package_name' => $lead->destination ?? 'N/A',
                                'start_date' => $earliestPayment ? $earliestPayment->due_date->toDateString() : null,
                            ];
                        } catch (\Throwable $e) {
                            \Illuminate\Support\Facades\Log::error('Error mapping upcoming tour: ' . $e->getMessage() . ' Lead ID: ' . $lead->id);
                            return null;
                        }
                    })
                    ->filter(function ($tour) use ($today) {
                        return $tour && $tour['start_date'] !== null && $tour['start_date'] >= $today;
                    })
                    ->sortBy('start_date')
                    ->take(10)
                    ->values()
                    ->toArray();
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: upcomingTours calculated');

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
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: latestQueryNotes calculated');

                // Sales reps (users with assigned leads)
                $salesRepsQuery = User::where('company_id', $companyId)
                    ->has('leadsAssigned')
                    ->withCount(['leadsAssigned as assigned'])
                    ->withCount([
                        'leadsAssigned as confirmed' => function ($query) {
                            $query->where('status', 'confirmed');
                        }
                    ])
                    ->withCount([
                        'leadsAssigned as rejected' => function ($query) {
                            $query->where('status', 'cancelled');
                        }
                    ])
                    ->withCount([
                        'leadsAssigned as pending' => function ($query) {
                            $query->whereNotIn('status', ['confirmed', 'cancelled']);
                        }
                    ]);

                // Hierarchy Restriction: Non-admins see own + subordinates
                if (!$currentUser->is_super_admin && !$currentUser->hasRole(['Company Admin', 'Admin'])) {
                    $subordinateIds = $currentUser->getAllSubordinateIds();
                    $salesRepsQuery->whereIn('id', $subordinateIds);
                } elseif ($currentUser->hasRole('Manager')) {
                    $salesRepsQuery->whereDoesntHave('roles', function ($q) {
                        $q->whereIn('name', ['Super Admin', 'Admin', 'Company Admin', 'Manager']);
                    });
                }

                $salesReps = $salesRepsQuery->get()
                    ->map(function ($user) {
                        return [
                            'user_id' => $user->id,
                            'name' => $user->name,
                            'assigned' => (int) $user->assigned,
                            'confirmed' => (int) $user->confirmed,
                            'rejected' => (int) $user->rejected,
                            'pending' => (int) $user->pending,
                        ];
                    })
                    ->toArray();
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: salesReps calculated');

                // Team Leaders specifically
                $teamLeaderQuery = User::role('Team Leader')
                    ->where('company_id', $companyId)
                    ->withCount(['leadsAssigned as assigned'])
                    ->withCount([
                        'leadsAssigned as confirmed' => function ($query) {
                            $query->where('status', 'confirmed');
                        }
                    ])
                    ->withCount([
                        'leadsAssigned as rejected' => function ($query) {
                            $query->where('status', 'cancelled');
                        }
                    ])
                    ->withCount([
                        'leadsAssigned as pending' => function ($query) {
                            $query->whereNotIn('status', ['confirmed', 'cancelled']);
                        }
                    ]);

                if (!$currentUser->is_super_admin && !$currentUser->hasRole(['Company Admin', 'Admin'])) {
                    $subordinateIds = $currentUser->getAllSubordinateIds();
                    $teamLeaderQuery->whereIn('id', $subordinateIds);
                }

                $teamLeaderStats = $teamLeaderQuery->get()
                    ->map(function ($user) {
                        return [
                            'id' => $user->id,
                            'name' => $user->name,
                            'is_active' => (bool) $user->is_active,
                            'assigned' => $user->assigned,
                            'confirmed' => $user->confirmed,
                            'rejected' => $user->rejected,
                            'pending' => $user->pending,
                        ];
                    })
                    ->toArray();
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: teamLeaderStats calculated');

                // Top lead sources
                $topLeadSources = Lead::withTrashed()->select('source', DB::raw('COUNT(*) as total'))
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
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: topLeadSources calculated');

                // Top destinations
                $topDestinations = Lead::withTrashed()->whereNotNull('destination')
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
                \Illuminate\Support\Facades\Log::info('Dashboard Stats: topDestinations calculated');

                return [
                    'today_queries' => (int) data_get($leadCounts, 'today_queries', 0),
                    'total_queries' => (int) data_get($leadCounts, 'total_queries', 0),
                    'proposal_sent' => (int) data_get($leadCounts, 'proposal_sent', 0),
                    'hot_leads' => (int) data_get($leadCounts, 'hot_leads', 0),
                    'proposal_confirmed' => $proposalConfirmed,
                    'cancelled' => (int) data_get($leadCounts, 'cancelled', 0),
                    'followups' => (int) data_get($leadCounts, 'followups', 0),
                    'confirmed' => (int) data_get($leadCounts, 'confirmed', 0),
                    'payment_collection_total' => (float) $paymentCollectionTotal,
                    'revenue_growth_monthly' => $revenueGrowthMonthly,
                    'this_year_queries_confirmed' => $thisYearQueriesConfirmed,
                    'upcoming_tours' => $upcomingTours,
                    'latest_query_notes' => $latestQueryNotes,
                    'sales_reps' => $salesReps,
                    'team_leader_stats' => $teamLeaderStats,
                    'top_lead_sources' => $topLeadSources,
                    'top_destinations' => $topDestinations,
                ];
            };

            // Cache for 5 minutes per user — safe for multi-tenant
            $cacheKey = 'dashboard_stats_v6_' . $currentUser->id;
            try {
                $stats = Cache::remember($cacheKey, 300, $calculateStats);
            } catch (\Exception $e) {
                // Fallback to array cache if default cache fails
                try {
                    $stats = Cache::store('array')->remember($cacheKey, 300, $calculateStats);
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

        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Dashboard Module Error', [
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString()
            ]);
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
            $currentUser = $request->user();
            $query = DB::table('lead_payments')
                ->select(
                    DB::raw('MONTH(lead_payments.created_at) as month'),
                    DB::raw('SUM(paid_amount) as amount')
                )
                ->join('leads', 'leads.id', '=', 'lead_payments.lead_id')
                ->whereYear('lead_payments.created_at', $currentYear);

            if (!$currentUser->is_super_admin && !$currentUser->hasRole(['Company Admin', 'Admin'])) {
                $subordinateIds = $currentUser->getAllSubordinateIds();
                $query->whereIn('leads.assigned_to', $subordinateIds);
            }

            $revenueData = $query->groupBy(DB::raw('MONTH(lead_payments.created_at)'))
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
            // Notes = remark present and no reminder_time (tasks have reminder_time set). Same as LeadDetails "notes".
            $currentUser = $request->user();
            $query = DB::table('lead_followups')
                ->join('leads', 'lead_followups.lead_id', '=', 'leads.id')
                ->select(
                    'lead_followups.lead_id',
                    'leads.client_name',
                    'lead_followups.remark as note',
                    'lead_followups.created_at'
                )
                ->whereNotNull('lead_followups.remark')
                ->where('lead_followups.remark', '!=', '')
                ->whereNull('lead_followups.reminder_time');

            if (!$currentUser->is_super_admin && !$currentUser->hasRole(['Company Admin', 'Admin'])) {
                $subordinateIds = $currentUser->getAllSubordinateIds();
                $query->whereIn('leads.assigned_to', $subordinateIds);
            }

            $leadNotes = $query->orderBy('lead_followups.created_at', 'desc')
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
            $currentUser = $request->user();
            // Group leads by assigned_to and get statistics
            $query = DB::table('leads')
                ->join('users', 'leads.assigned_to', '=', 'users.id')
                ->select(
                    'users.name',
                    DB::raw('COUNT(leads.id) as assigned'),
                    DB::raw("SUM(CASE WHEN leads.status = 'confirmed' THEN 1 ELSE 0 END) as confirmed")
                )
                ->whereNotNull('leads.assigned_to');

            if (!$currentUser->is_super_admin && !$currentUser->hasRole(['Company Admin', 'Admin'])) {
                $subordinateIds = $currentUser->getAllSubordinateIds();
                $query->whereIn('leads.assigned_to', $subordinateIds);
            }

            $salesReps = $query->groupBy('leads.assigned_to', 'users.name')
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
            $topDestinations = Lead::withTrashed()->whereNotNull('destination')
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

