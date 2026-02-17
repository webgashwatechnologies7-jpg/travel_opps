<?php

$company = App\Models\Company::where('name', 'LIKE', '%Gashwa Technologies%')->first();

if (!$company) {
    echo "Company not found.\n";
    exit;
}

$plan = App\Models\SubscriptionPlan::firstOrCreate(
    ['name' => 'Premium Plan'],
    [
        'description' => 'Full access plan',
        'slug' => 'premium-plan',
        'price_monthly' => 0,
        'price_yearly' => 0,
        'max_users' => 10,
        'max_storage_gb' => 10,
        'is_active' => true
    ]
);

$company->subscription_plan_id = $plan->id;
$company->save();

echo "Plan 'Premium Plan' assigned to " . $company->name . "\n";

// Attach features
$features = \App\Models\SubscriptionPlanFeature::all();

if ($features->isEmpty()) {
    echo "No features found in database. Run seeder first.\n";
} else {
    foreach ($features as $f) {
        // Check if attached
        $exists = $plan->planFeatures()->where('subscription_features.id', $f->id)->exists();
        if (!$exists) {
            $plan->planFeatures()->attach($f->id, ['is_active' => true, 'limit_value' => 1000]);
            echo "Attached feature: " . $f->key . "\n";
        } else {
            $plan->planFeatures()->updateExistingPivot($f->id, ['is_active' => true]);
            echo "Updated feature: " . $f->key . "\n";
        }
    }
}
