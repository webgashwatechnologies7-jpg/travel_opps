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
            // Validate the parameters
            $validator = Validator::make($request->all(), [
                'month' => 'nullable|regex:/^\d{4}-\d{2}$/',
                'timeframe' => 'nullable|in:day,week,month,year,custom',
                'from_date' => 'nullable|date',
                'to_date' => 'nullable|date',
                'destination' => 'nullable|string',
                'employee_id' => 'nullable|exists:users,id',
                'filter_by' => 'nullable|in:created_at,travel_date',
                'group_by' => 'nullable|in:user,destination,source',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $timeframe = $request->input('timeframe', 'month');
            $groupBy = $request->input('group_by', 'user');
            $month = $request->input('month', now()->format('Y-m'));
            $destination = $request->input('destination');
            $employeeId = $request->input('employee_id');
            $filterBy = $request->input('filter_by', 'created_at');

            // Determine start and end dates
            $startDate = null;
            $endDate = null;

            switch ($timeframe) {
                case 'day':
                    $startDate = now()->startOfDay();
                    $endDate = now()->endOfDay();
                    break;
                case 'week':
                    $startDate = now()->startOfWeek();
                    $endDate = now()->endOfWeek();
                    break;
                case 'year':
                    $startDate = now()->startOfYear();
                    $endDate = now()->endOfYear();
                    break;
                case 'custom':
                    $startDate = $request->input('from_date') ? \Carbon\Carbon::parse($request->input('from_date'))->startOfDay() : now()->startOfMonth();
                    $endDate = $request->input('to_date') ? \Carbon\Carbon::parse($request->input('to_date'))->endOfDay() : now()->endOfMonth();
                    break;
                case 'month':
                default:
                    if (!$month) $month = now()->format('Y-m');
                    $monthParts = explode('-', $month);
                    $yearNum = (int) $monthParts[0];
                    $monthNum = (int) $monthParts[1];
                    $startDate = \Carbon\Carbon::createFromDate($yearNum, $monthNum, 1)->startOfMonth();
                    $endDate = $startDate->copy()->endOfMonth();
                    break;
            }

            // Date field for filtering
            $dateField = ($filterBy === 'travel_date') ? 'travel_start_date' : 'created_at';
            $leadsQuery = Lead::whereBetween($dateField, [$startDate, $endDate]);

            // Apply universal filters
            if ($destination) {
                $leadsQuery->where('destination', 'like', '%' . $destination . '%');
            }
            if ($employeeId) {
                $leadsQuery->where('assigned_to', $employeeId);
            }

            // Hierarchy filter for users
            $currentUser = auth()->user();
            if (!$currentUser->is_super_admin && !$currentUser->hasRole(['Company Admin', 'Admin'])) {
                $subordinateIds = $currentUser->getAllSubordinateIds();
                $leadsQuery->whereIn('assigned_to', $subordinateIds);
            }

            $performanceData = [];

            if ($groupBy === 'user') {
                // Group by User
                $userQuery = User::where('is_active', true);
                
                // Ensure users are filtered by company_id if current user is tied to a company
                if (!$currentUser->is_super_admin && $currentUser->company_id) {
                    $userQuery->where('company_id', $currentUser->company_id);
                }

                if ($employeeId) {
                    $userQuery->where('id', $employeeId);
                } elseif (!$currentUser->is_super_admin && !$currentUser->hasRole(['Company Admin', 'Admin'])) {
                    $subordinateIds = $currentUser->getAllSubordinateIds();
                    $userQuery->whereIn('id', $subordinateIds);
                }
                $users = $userQuery->select('id', 'name')->get();
                $userIds = $users->pluck('id')->toArray();

                $leadsStats = (clone $leadsQuery)->setEagerLoads([])
                    ->select('assigned_to', 
                        \Illuminate\Support\Facades\DB::raw('COUNT(*) as total_leads'),
                        \Illuminate\Support\Facades\DB::raw('SUM(CASE WHEN status = "confirmed" THEN 1 ELSE 0 END) as confirmed_leads')
                    )
                    ->whereIn('assigned_to', $userIds)
                    ->groupBy('assigned_to')
                    ->get()
                    ->keyBy('assigned_to');

                // Get Targets for Users
                $targetMonth = $startDate->format('Y-m');
                $targets = EmployeeTarget::whereIn('user_id', $userIds)
                    ->where('month', $targetMonth)
                    ->get()
                    ->keyBy('user_id');

                foreach ($users as $user) {
                    $stats = $leadsStats->get($user->id);
                    $target = $targets->get($user->id);
                    $performanceData[] = [
                        'id' => $user->id,
                        'name' => $user->name,
                        'total_leads' => $stats ? (int) $stats->total_leads : 0,
                        'confirmed_leads' => $stats ? (int) $stats->confirmed_leads : 0,
                        'target_amount' => $target ? (float) $target->target_amount : 0,
                        'achieved_amount' => $target ? (float) $target->achieved_amount : 0,
                        'completion_percentage' => $target && (float)$target->target_amount > 0 ? round(((float)$target->achieved_amount / (float)$target->target_amount) * 100, 2) : 0,
                    ];
                }
            } else {
                // Group by Destination or Source
                $groupField = $groupBy === 'destination' ? 'destination' : 'source';
                
                // We must use setEagerLoads([]) to prevent relationship joins adding columns that break groupBy
                $stats = (clone $leadsQuery)->setEagerLoads([])
                    ->select($groupField, 
                        \Illuminate\Support\Facades\DB::raw('COUNT(*) as total_leads'),
                        \Illuminate\Support\Facades\DB::raw('SUM(CASE WHEN status = "confirmed" THEN 1 ELSE 0 END) as confirmed_leads')
                    )
                    ->groupBy($groupField)
                    ->orderBy('total_leads', 'DESC')
                    ->get();

                foreach ($stats as $item) {
                    $val = $item->$groupField ?: ($groupBy === 'destination' ? 'Not Specified' : 'Direct/Other');
                    $performanceData[] = [
                        'id' => $val,
                        'name' => $val,
                        'total_leads' => (int) $item->total_leads,
                        'confirmed_leads' => (int) $item->confirmed_leads,
                        'target_amount' => 0,
                        'achieved_amount' => 0,
                        'completion_percentage' => (int)$item->total_leads > 0 ? round(((int)$item->confirmed_leads / (int)$item->total_leads) * 100, 2) : 0,
                    ];
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Performance data retrieved successfully',
                'data' => [
                    'group_by' => $groupBy,
                    'timeframe' => $timeframe,
                    'start_date' => $startDate->toDateTimeString(),
                    'end_date' => $endDate->toDateTimeString(),
                    'employees' => $performanceData, // Reusing key 'employees' for frontend compatibility
                    'total_items' => count($performanceData),
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

