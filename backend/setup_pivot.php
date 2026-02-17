<?php

$company = App\Models\Company::where('name', 'LIKE', '%Gashwa Technologies%')->first();
if (!$company) {
    exit("Company not found\n");
}

$plan = $company->subscriptionPlan;
if (!$plan) {
    exit("Plan not found\n");
}

$features = App\Models\SubscriptionFeature::all();
if ($features->isEmpty()) {
    exit("No subscription features found in DB\n");
}

foreach ($features as $f) {
    // Check if pivot exists using raw DB query to be safe
    $exists = DB::table('plan_features')
        ->where('subscription_plan_id', $plan->id)
        ->where('subscription_feature_id', $f->id)
        ->exists();

    if (!$exists) {
        DB::table('plan_features')->insert([
            'subscription_plan_id' => $plan->id,
            'subscription_feature_id' => $f->id,
            'is_active' => true,
            'limit_value' => 1000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        echo "Attached: " . $f->key . "\n";
    } else {
        DB::table('plan_features')
            ->where('subscription_plan_id', $plan->id)
            ->where('subscription_feature_id', $f->id)
            ->update(['is_active' => true]);
        echo "Updated: " . $f->key . "\n";
    }
}
