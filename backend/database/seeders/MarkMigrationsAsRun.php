<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MarkMigrationsAsRun extends Seeder
{
    /**
     * Run the database seeds.
     * This marks existing migrations as run when tables already exist.
     */
    public function run(): void
    {
        $migrations = [
            '2014_10_12_000000_create_users_table',
            '2014_10_12_100000_create_password_reset_tokens_table',
            '2019_08_19_000000_create_failed_jobs_table',
            '2019_12_14_000001_create_personal_access_tokens_table',
        ];

        $maxBatch = DB::table('migrations')->max('batch');
        $batch = $maxBatch ? $maxBatch + 1 : 1;

        foreach ($migrations as $migration) {
            // Check if migration is already recorded
            $exists = DB::table('migrations')
                ->where('migration', $migration)
                ->exists();

            if (!$exists) {
                DB::table('migrations')->insert([
                    'migration' => $migration,
                    'batch' => $batch,
                ]);
                $this->command->info("Marked migration as run: {$migration}");
            } else {
                $this->command->warn("Migration already exists: {$migration}");
            }
        }
    }
}

