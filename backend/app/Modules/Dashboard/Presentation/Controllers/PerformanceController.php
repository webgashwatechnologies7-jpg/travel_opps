<?php

namespace App\Modules\Dashboard\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Modules\Hr\Domain\Entities\EmployeeTarget;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PerformanceController extends Controller
{
    /**
     * Get employee performance metrics for a given month.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function employeePerformance(Request $request): JsonResponse
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

            // Get all active users
            $users = User::where('is_active', true)->get();

            $performanceData = [];

            foreach ($users as $user) {
                // Count total leads assigned to this user in the given month
                $totalLeads = Lead::where('assigned_to', $user->id)
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count();

                // Count confirmed leads assigned to this user in the given month
                $confirmedLeads = Lead::where('assigned_to', $user->id)
                    ->where('status', 'confirmed')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->count();

                // Get target and achieved amount from employee_targets
                $target = EmployeeTarget::where('user_id', $user->id)
                    ->where('month', $month)
                    ->first();

                $targetAmount = $target ? (float) $target->target_amount : 0;
                $achievedAmount = $target ? (float) $target->achieved_amount : 0;

                // Calculate completion percentage
                $completionPercentage = 0;
                if ($targetAmount > 0) {
                    $completionPercentage = round(($achievedAmount / $targetAmount) * 100, 2);
                }

                $performanceData[] = [
                    'user_id' => $user->id,
                    'name' => $user->name,
                    'total_leads' => $totalLeads,
                    'confirmed_leads' => $confirmedLeads,
                    'achieved_amount' => round($achievedAmount, 2),
                    'target_amount' => round($targetAmount, 2),
                    'completion_percentage' => round($completionPercentage, 2),
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Employee performance data retrieved successfully',
                'data' => [
                    'month' => $month,
                    'employees' => $performanceData,
                    'total_employees' => count($performanceData),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving employee performance data',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

