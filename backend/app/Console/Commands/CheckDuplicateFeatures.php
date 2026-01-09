<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CheckDuplicateFeatures extends Command
{
    protected $signature = 'features:check-duplicates';
    protected $description = 'Check for duplicate features in subscription_plan_features table';

    public function handle()
    {
        $this->info('Checking for duplicate features...');
        
        // Find duplicates
        $duplicates = DB::table('subscription_plan_features')
            ->select('subscription_plan_id', 'feature_key', DB::raw('COUNT(*) as count'))
            ->groupBy('subscription_plan_id', 'feature_key')
            ->having('count', '>', 1)
            ->get();
        
        if ($duplicates->count() > 0) {
            $this->error("Found {$duplicates->count()} duplicate entries!");
            
            foreach ($duplicates as $dup) {
                $this->line("Plan ID: {$dup->subscription_plan_id}, Feature: {$dup->feature_key}, Count: {$dup->count}");
                
                // Show all entries for this duplicate
                $entries = DB::table('subscription_plan_features')
                    ->where('subscription_plan_id', $dup->subscription_plan_id)
                    ->where('feature_key', $dup->feature_key)
                    ->get(['id', 'is_enabled', 'created_at']);
                
                foreach ($entries as $entry) {
                    $this->line("  - ID: {$entry->id}, Enabled: {$entry->is_enabled}, Created: {$entry->created_at}");
                }
            }
        } else {
            $this->info('No duplicates found! ✅');
        }
        
        // Show total counts per plan
        $this->info("\nTotal features per plan:");
        $counts = DB::table('subscription_plan_features')
            ->select('subscription_plan_id', DB::raw('COUNT(*) as count'))
            ->groupBy('subscription_plan_id')
            ->get();
        
        foreach ($counts as $count) {
            $plan = DB::table('subscription_plans')->where('id', $count->subscription_plan_id)->first();
            $planName = $plan ? $plan->name : "Plan {$count->subscription_plan_id}";
            $this->line("  {$planName} (ID: {$count->subscription_plan_id}): {$count->count} features");
        }
        
        return 0;
    }
}

