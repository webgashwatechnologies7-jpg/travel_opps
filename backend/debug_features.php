<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== 🔍 DEBUGGING SUBSCRIPTION FEATURES ===\n\n";

// Check subscription plans
echo "1. 📋 Subscription Plans:\n";
$plans = \App\Models\SubscriptionPlan::all();

foreach ($plans as $plan) {
    echo "\n📊 Plan: {$plan->name} (ID: {$plan->id})\n";
    echo "   Permissions: " . json_encode($plan->permissions) . "\n";
    
    // Check features directly
    $features = \App\Models\SubscriptionPlanFeature::where('subscription_plan_id', $plan->id)->get();
    echo "   Total Features: " . $features->count() . "\n";
    
    $enabledFeatures = \App\Models\SubscriptionPlanFeature::where('subscription_plan_id', $plan->id)
        ->where('is_enabled', true)
        ->get();
    echo "   Enabled Features: " . $enabledFeatures->count() . "\n";
    
    foreach ($enabledFeatures as $feature) {
        echo "     ✅ {$feature->feature_key} - {$feature->feature_name}\n";
    }
}

// Test the relationship
echo "\n2. 🔗 Testing Relationship:\n";
$plan = \App\Models\SubscriptionPlan::find(1);
echo "Plan: {$plan->name}\n";

$features = $plan->features()->where('is_enabled', true)->get();
echo "Features via relationship: " . $features->count() . "\n";

// Test getEnabledFeaturesFromPermissions method
echo "\n3. 🎯 Testing Permission Method:\n";
$enabledFeatures = $plan->getEnabledFeaturesFromPermissions();
echo "Features via permissions: " . $enabledFeatures->count() . "\n";

foreach ($enabledFeatures as $feature) {
    echo "   ✅ {$feature->feature_name}\n";
}

echo "\n=== 🚀 DEBUG COMPLETE ===\n";

?>
