<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CleanupNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notifications:cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete read notifications older than 24 hours';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $count = \Illuminate\Support\Facades\DB::table('notifications')
            ->whereNotNull('read_at')
            ->where('read_at', '<=', now()->subHours(24))
            ->delete();

        $this->info("Deleted {$count} read notifications older than 24 hours.");
    }
}
