<?php

namespace App\Modules\Dashboard\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DestinationAnalyticsController extends Controller
{
    /**
     * Get destination performance analytics for a given month.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function destinationPerformance(Request $request): JsonResponse
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

            // Group leads by destination and calculate metrics
            $destinationAnalytics = Lead::whereBetween('created_at', [$startDate, $endDate])
                ->whereNotNull('destination') // Only include leads with a destination
                ->select('destination')
                ->selectRaw('COUNT(*) as total_leads')
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as confirmed_leads', ['confirmed'])
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as cancelled_leads', ['cancelled'])
                ->groupBy('destination')
                ->orderBy('destination')
                ->get()
                ->map(function ($item) {
                    $totalLeads = (int) $item->total_leads;
                    $confirmedLeads = (int) $item->confirmed_leads;
                    $cancelledLeads = (int) $item->cancelled_leads;
                    $conversionRate = $totalLeads > 0 
                        ? round(($confirmedLeads / $totalLeads) * 100, 2) 
                        : 0;

                    return [
                        'destination' => $item->destination,
                        'total_leads' => $totalLeads,
                        'confirmed_leads' => $confirmedLeads,
                        'cancelled_leads' => $cancelledLeads,
                        'conversion_rate' => $conversionRate,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Destination performance analytics retrieved successfully',
                'data' => [
                    'month' => $month,
                    'destinations' => $destinationAnalytics,
                    'total_destinations' => $destinationAnalytics->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving destination performance analytics',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

