<?php

use App\Models\SubscriptionPlan;
use App\Models\SubscriptionFeature;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$feature = SubscriptionFeature::updateOrCreate(
    ['key' => 'call_management'],
    [
        'name' => 'Call Management System',
        'description' => 'Telephony integration and call tracking.',
        'is_active' => true
    ]
);

$plans = SubscriptionPlan::all();
foreach ($plans as $plan) {
    if ($plan->planFeatures()) {
        $plan->planFeatures()->syncWithoutDetaching([
            $feature->id => [
                'is_active' => 1,
                'limit_value' => null,
            ]
        ]);
    }
}

// Now sync Gashwa specific features if it has overrides
$companies = \App\Models\Company::all();
foreach ($companies as $company) {
    $plan = $company->subscriptionPlan;
    if ($plan) {
        $company->features = $plan->features;
        $company->save();
    }
}

echo "Feature 'call_management' has been successfully enabled and synced for ALL companies!\n";
