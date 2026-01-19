<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\EmployeePerformanceLog;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Payments\Domain\Entities\Payment;
use App\Modules\Hr\Domain\Entities\EmployeeTarget;
use Illuminate\Console\Command;
use Carbon\Carbon;

class LogEmployeePerformance extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'employees:log-performance {--date= : The date to log performance for (Y-m-d format). Defaults to yesterday.}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Log daily performance metrics for all employees';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $date = $this->option('date') 
            ? Carbon::parse($this->option('date')) 
            : Carbon::yesterday();

        $this->info("Logging employee performance for date: " . $date->format('Y-m-d'));

        // Get all active users
        $users = User::where('is_active', true)->get();

        foreach ($users as $user) {
            $this->info("Processing user: {$user->name} (ID: {$user->id})");

            // Count leads assigned on this date
            $leadsAssigned = Lead::where('assigned_to', $user->id)
                ->whereDate('created_at', $date)
                ->count();

            // Count confirmed leads on this date
            $leadsConfirmed = Lead::where('assigned_to', $user->id)
                ->where('status', 'confirmed')
                ->whereDate('created_at', $date)
                ->count();

            // Count cancelled leads on this date
            $leadsCancelled = Lead::where('assigned_to', $user->id)
                ->where('status', 'cancelled')
                ->whereDate('created_at', $date)
                ->count();

            // Calculate revenue generated on this date
            $revenueGenerated = Payment::whereHas('lead', function($query) use ($user, $date) {
                $query->where('assigned_to', $user->id)
                    ->where('status', 'confirmed')
                    ->whereDate('created_at', $date);
            })->sum('amount');

            // Get monthly target
            $monthlyTarget = EmployeeTarget::where('user_id', $user->id)
                ->where('month', $date->format('Y-m'))
                ->first();

            $targetAmount = $monthlyTarget ? $monthlyTarget->target_amount : 0;
            $achievementAmount = $monthlyTarget ? $monthlyTarget->achieved_amount : 0;

            // Check if performance log already exists for this date
            $existingLog = EmployeePerformanceLog::where('user_id', $user->id)
                ->where('date', $date)
                ->first();

            if ($existingLog) {
                // Update existing log
                $existingLog->update([
                    'leads_assigned' => $leadsAssigned,
                    'leads_confirmed' => $leadsConfirmed,
                    'leads_cancelled' => $leadsCancelled,
                    'revenue_generated' => $revenueGenerated,
                    'target_amount' => $targetAmount,
                    'achievement_amount' => $achievementAmount,
                ]);

                $this->info("Updated performance log for user: {$user->name}");
            } else {
                // Create new log
                EmployeePerformanceLog::create([
                    'user_id' => $user->id,
                    'date' => $date,
                    'leads_assigned' => $leadsAssigned,
                    'leads_confirmed' => $leadsConfirmed,
                    'leads_cancelled' => $leadsCancelled,
                    'revenue_generated' => $revenueGenerated,
                    'target_amount' => $targetAmount,
                    'achievement_amount' => $achievementAmount,
                ]);

                $this->info("Created performance log for user: {$user->name}");
            }
        }

        $this->info("Employee performance logging completed for date: " . $date->format('Y-m-d'));
        
        return 0;
    }
}
