<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\CompanySettings;
use App\Models\User;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Payments\Domain\Entities\Payment;

class AttendanceController extends Controller
{
    /**
     * Mark Punch In
     */
    public function punchIn(Request $request)
    {
        $user = auth()->user();
        $today = Carbon::today()->toDateString();
        $clientIp = $request->ip();

        // Check if already punched in
        $existing = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if ($existing && $existing->punch_in) {
            return response()->json(['message' => 'Already punched in for today'], 400);
        }

        // IP Restriction Check
        $settings = CompanySettings::getSettings($user->company_id);
        if ($settings->attendance_mode === 'fixed_ip' && !$user->allow_remote_attendance) {
            $allowedIps = $settings->allowed_ips ?? [];
            if (!in_array($clientIp, $allowedIps)) {
                return response()->json([
                    'message' => 'Punch-in allowed only from office network.',
                    'your_ip' => $clientIp
                ], 403);
            }
        }

        $attendance = Attendance::updateOrCreate(
            ['user_id' => $user->id, 'date' => $today],
            [
                'company_id' => $user->company_id,
                'punch_in' => Carbon::now()->toTimeString(),
                'status' => 'present',
                'ip_address' => $clientIp,
                'is_remote' => $user->allow_remote_attendance
            ]
        );

        return response()->json([
            'message' => 'Punched in successfully',
            'data' => $attendance
        ]);
    }

    /**
     * Mark Punch Out
     */
    public function punchOut(Request $request)
    {
        $user = auth()->user();
        $today = Carbon::today()->toDateString();

        $attendance = Attendance::where('user_id', $user->id)
            ->where('date', $today)
            ->first();

        if (!$attendance || !$attendance->punch_in) {
            return response()->json(['message' => 'No punch-in record found for today'], 400);
        }

        if ($attendance->punch_out) {
            return response()->json(['message' => 'Already punched out for today'], 400);
        }

        $punchIn = Carbon::parse($attendance->punch_in);
        $punchOut = Carbon::now();
        $totalHours = $punchOut->diffInMinutes($punchIn) / 60;
        
        // Overtime Calculation
        $standardHours = $user->working_hours_per_day ?? 9;
        $overtimeHours = 0;
        if ($totalHours > $standardHours) {
            $overtimeHours = $totalHours - $standardHours;
        }

        $attendance->update([
            'punch_out' => $punchOut->toTimeString(),
            'total_hours' => round($totalHours, 2),
            'overtime_hours' => round($overtimeHours, 2)
        ]);

        return response()->json([
            'message' => 'Punched out successfully',
            'data' => $attendance
        ]);
    }

    /**
     * Get Monthly Report for current user
     */
    public function getMonthlyReport(Request $request)
    {
        $user = auth()->user();
        $month = $request->month ?? Carbon::now()->month;
        $year = $request->year ?? Carbon::now()->year;

        $records = Attendance::where('user_id', $user->id)
            ->whereYear('date', $year)
            ->whereMonth('date', $month)
            ->orderBy('date', 'desc')
            ->get();

        $summary = [
            'total_present' => $records->where('status', 'present')->count(),
            'total_half_day' => $records->where('status', 'half_day')->count(),
            'total_absent' => $records->where('status', 'absent')->count(),
            'total_hours' => $records->sum('total_hours'),
            'total_overtime' => $records->sum('overtime_hours'),
            'estimated_salary' => $this->calculateSalary($user, $records, $month, $year)
        ];

        return response()->json([
            'summary' => $summary,
            'records' => $records
        ]);
    }

    /**
     * Admin: Get all employees attendance with status and summary
     */
    public function getAllAttendance(Request $request)
    {
        $user = auth()->user();
        $companyId = $user->company_id;
        
        $date = $request->date ?? Carbon::today()->toDateString();
        $month = $request->month;
        $year = $request->year;

        $query = Attendance::with('user:id,name,email,role')
            ->where('company_id', $companyId);

        if ($month && $year) {
            $query->whereMonth('date', $month)->whereYear('date', $year);
        } else {
            $query->whereDate('date', $date);
        }

        if ($request->user_id) {
            $query->where('user_id', $request->user_id);
        }

        $records = $query->orderBy('date', 'desc')->get();

        // If it's a specific day, let's also show who hasn't punched in yet
        if (!$month && $date === Carbon::today()->toDateString()) {
            $punchedInUserIds = $records->pluck('user_id')->toArray();
            $absentUsers = User::where('company_id', $companyId)
                ->whereNotIn('id', $punchedInUserIds)
                ->where('is_active', true)
                ->select('id', 'name', 'email', 'role')
                ->get();

            return response()->json([
                'present' => $records,
                'absent' => $absentUsers,
                'summary' => [
                    'total_employees' => User::where('company_id', $companyId)->where('is_active', true)->count(),
                    'present_count' => $records->count(),
                    'absent_count' => $absentUsers->count()
                ]
            ]);
        }

        return response()->json([
            'records' => $records,
            'summary' => [
                'total_present' => $records->where('status', 'present')->count(),
                'total_hours' => $records->sum('total_hours'),
                'total_overtime' => $records->sum('overtime_hours')
            ]
        ]);
    }

    /**
     * Private helper to calculate salary based on attendance and commission
     */
    private function calculateSalary($user, $records, $month = null, $year = null)
    {
        $basePay = 0;
        $overtimePay = 0;
        $commissionPay = 0;

        // 1. Calculate Base Salary (if employee has a salary component)
        if ($user->employment_type !== 'commission' && $user->base_salary) {
            if ($user->salary_type === 'monthly') {
                $dayRate = $user->base_salary / 30;
                $payableDays = $records->where('status', 'present')->count() + ($records->where('status', 'half_day')->count() * 0.5);
                $basePay = $dayRate * $payableDays;
            } elseif ($user->salary_type === 'daily') {
                $basePay = $user->base_salary * ($records->where('status', 'present')->count() + ($records->where('status', 'half_day')->count() * 0.5));
            } elseif ($user->salary_type === 'hourly') {
                $basePay = $records->sum('total_hours') * $user->base_salary;
            }
            $overtimePay = $records->sum('overtime_hours') * ($user->overtime_rate ?? 0);
        }

        // 2. Calculate Commission (if employee has a commission component)
        if (in_array($user->employment_type, ['commission', 'both']) && $user->commission_percentage > 0) {
            $month = $month ?? Carbon::now()->month;
            $year = $year ?? Carbon::now()->year;

            // Get revenue from confirmed leads assigned to this user in this month
            // We use Payment model for actual revenue received
            $revenue = Payment::whereHas('lead', function ($query) use ($user, $month, $year) {
                $query->where('assigned_to', $user->id)
                    ->where('status', 'confirmed')
                    ->whereMonth('created_at', $month)
                    ->whereYear('created_at', $year);
            })->sum('amount');

            $commissionPay = ($revenue * $user->commission_percentage) / 100;
        }

        return round($basePay + $overtimePay + $commissionPay, 2);
    }
}
