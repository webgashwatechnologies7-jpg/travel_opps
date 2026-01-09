<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Services\GmailService;
use Illuminate\Support\Facades\Log;

class SyncGmailInbox extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'gmail:sync';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync Gmail inbox for all connected users';

    protected $gmailService;

    public function __construct(GmailService $gmailService)
    {
        parent::__construct();
        $this->gmailService = $gmailService;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $users = User::whereNotNull('google_token')->get();

        foreach ($users as $user) {
            $this->info("Syncing Gmail for user: " . $user->email);
            try {
                $this->gmailService->syncInbox($user);
                $this->info("Successfully synced for " . $user->email);
            } catch (\Exception $e) {
                $this->error("Failed to sync for " . $user->email . ": " . $e->getMessage());
                Log::error("Gmail sync failed for user {$user->id}: " . $e->getMessage());
            }
        }

        return Command::SUCCESS;
    }
}
