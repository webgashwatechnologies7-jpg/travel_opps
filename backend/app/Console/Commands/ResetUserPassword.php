<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetUserPassword extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:reset-password {email} {--password=password123}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset user password by email';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $password = $this->option('password');

        $user = User::where('email', $email)->first();

        if (!$user) {
            $this->error("User with email '{$email}' not found!");
            return 1;
        }

        $user->password = Hash::make($password);
        $user->save();

        $this->info("Password reset successfully for user: {$user->name} ({$user->email})");
        $this->info("New password: {$password}");
        $this->warn("Please change the password after login!");

        return 0;
    }
}
