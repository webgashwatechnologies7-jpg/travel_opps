<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // $schedule->command('inspire')->hourly();
        
        // Send payment reminders daily at 09:00 AM
        $schedule->command('payments:send-reminders')
            ->dailyAt('09:00')
            ->timezone('UTC');
        
        // Sync Google Sheets leads every 10 minutes
        $schedule->command('google-sheets:sync-leads')
            ->everyTenMinutes();

        // Sync Gmail inbox every 5 minutes
        $schedule->command('gmail:sync')
            ->everyFiveMinutes();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
