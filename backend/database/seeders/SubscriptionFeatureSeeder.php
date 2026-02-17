<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SubscriptionFeatureSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing hardcoded features
        $features = \App\Models\SubscriptionPlanFeature::getAvailableFeatures();

        foreach ($features as $key => $data) {
            \Illuminate\Support\Facades\DB::table('subscription_features')->updateOrInsert(
                ['key' => $key],
                [
                    'name' => $data['name'],
                    'description' => $data['description'] ?? null,
                    'has_limit' => $data['has_limit'] ?? false,
                    'limit_label' => $data['limit_label'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            );
        }
    }
}
