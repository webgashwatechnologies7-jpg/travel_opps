<?php
$user = App\Models\User::where('name', 'LIKE', '%Pankaj%')->with(['company.subscriptionPlan.planFeatures'])->first();

if (!$user) {
    echo "User not found.\n";
    exit;
}

echo "User: " . $user->name . " (ID: " . $user->id . ")\n";
echo "Role: " . implode(', ', $user->getRoleNames()->toArray()) . "\n";

if ($user->company) {
    echo "Company: " . $user->company->name . "\n";
    if ($user->company->subscriptionPlan) {
        echo "Plan: " . $user->company->subscriptionPlan->name . "\n";
        echo "--- Features ---\n";
        foreach ($user->company->subscriptionPlan->planFeatures as $feature) {
            echo $feature->key . ": " . ($feature->pivot->is_active ? 'Active' : 'Inactive') . "\n";
        }
    } else {
        echo "No Subscription Plan found for this company.\n";
    }
} else {
    echo "No Company found for this user.\n";
}
