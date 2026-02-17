
$out = [];
// Try to find a company user
$user = \App\Models\User::where('is_super_admin', false)->whereNotNull('company_id')->latest()->first();

if (!$user) {
    echo "No user found\n";
    exit;
}

echo "User: " . $user->name . " (" . $user->email . ")\n";

if (!$user->company_id) {
    echo "No company\n";
    exit;
}

$company = $user->company;
echo "Company: " . $company->name . "\n";
echo "Plan ID: " . $company->subscription_plan_id . "\n";

if (!$company->subscriptionPlan) {
    echo "No plan\n";
    exit;
}

echo "Plan Name: " . $company->subscriptionPlan->name . "\n";

// 1. Check Plan Features using `planFeatures` relationship (Pivot)
$pivotFeatures = $company->subscriptionPlan->planFeatures()->wherePivot('is_active', true)->get();
echo "Pivot Features: " . implode(', ', $pivotFeatures->pluck('key')->toArray()) . "\n";

// 2. Check Plan Features using `permissions` column (JSON array of IDs)
$permissionIds = $company->subscriptionPlan->permissions;
echo "Permissions Column (JSON IDs): " . json_encode($permissionIds) . "\n";

// 3. Permissions logic from CompanySettingsController
$allowedNames = collect(['view dashboard', 'manage profile']);
$planFeaturesFromPerms = $company->subscriptionPlan->getEnabledFeaturesFromPermissions();
echo "Enabled Features form Perms Count: " . $planFeaturesFromPerms->count() . "\n";
if ($planFeaturesFromPerms->count() > 0) {
    echo "Enabled Features Keys: " . implode(', ', $planFeaturesFromPerms->pluck('feature_key')->toArray()) . "\n";
} else {
    echo "Enabled Features Keys: (none)\n";
}

$allowedNames = $allowedNames->merge($planFeaturesFromPerms->pluck('feature_key'));
$finalAllowed = $allowedNames->unique()->values();
echo "Final Allowed Names: " . implode(', ', $finalAllowed->toArray()) . "\n";

// 4. Check Spatie Permissions Table
$allPerms = \Spatie\Permission\Models\Permission::all();
echo "All Spatie Permissions in DB Count: " . $allPerms->count() . "\n";
if ($allPerms->count() > 0) {
    echo "All Spatie Permissions in DB: " . implode(', ', $allPerms->pluck('name')->toArray()) . "\n";
}

$finalPermissions = \Spatie\Permission\Models\Permission::whereIn('name', $finalAllowed)->orderBy('name')->get(['id', 'name']);
echo "Final Permissions Returned to API Count: " . $finalPermissions->count() . "\n";
if ($finalPermissions->count() > 0) {
    echo "Final Permissions Returned to API: " . implode(', ', $finalPermissions->pluck('name')->toArray()) . "\n";
}