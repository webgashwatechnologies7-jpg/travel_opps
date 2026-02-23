<?php

namespace App\Traits;

use Carbon\Carbon;
use Illuminate\Http\Request;

trait FinancialPeriodTrait
{
    /**
     * Get start and end dates based on period or custom dates.
     * 
     * @param Request $request
     * @return array [Carbon $startDate, Carbon $endDate]
     */
    protected function getPeriodDates(Request $request): array
    {
        $period = $request->input('period', 'monthly');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');

        if (!$startDate || !$endDate) {
            switch ($period) {
                case 'weekly':
                    $startDate = now()->startOfWeek();
                    $endDate = now()->endOfWeek();
                    break;
                case 'yearly':
                    $startDate = now()->startOfYear();
                    $endDate = now()->endOfYear();
                    break;
                case 'monthly':
                default:
                    $startDate = now()->startOfMonth();
                    $endDate = now()->endOfMonth();
                    break;
            }
        } else {
            $startDate = Carbon::parse($startDate);
            $endDate = Carbon::parse($endDate);
        }

        return [$startDate, $endDate];
    }
}
