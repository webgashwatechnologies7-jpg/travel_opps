<?php

namespace App\Modules\Dashboard\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class SourceAnalyticsController extends Controller
{
    /**
     * Get source ROI analytics for a given month.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function sourceRoi(Request $request): JsonResponse
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

            // Group leads by source and calculate metrics
            $sourceAnalytics = Lead::whereBetween('created_at', [$startDate, $endDate])
                ->select('source')
                ->selectRaw('COUNT(*) as total_leads')
                ->selectRaw('SUM(CASE WHEN status = ? THEN 1 ELSE 0 END) as confirmed_leads', ['confirmed'])
                ->groupBy('source')
                ->orderBy('source')
                ->get()
                ->map(function ($item) {
                    $totalLeads = (int) $item->total_leads;
                    $confirmedLeads = (int) $item->confirmed_leads;
                    $conversionRate = $totalLeads > 0 
                        ? round(($confirmedLeads / $totalLeads) * 100, 2) 
                        : 0;

                    return [
                        'source' => $item->source,
                        'total_leads' => $totalLeads,
                        'confirmed_leads' => $confirmedLeads,
                        'conversion_rate' => $conversionRate,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Source ROI analytics retrieved successfully',
                'data' => [
                    'month' => $month,
                    'sources' => $sourceAnalytics,
                    'total_sources' => $sourceAnalytics->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving source ROI analytics',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

