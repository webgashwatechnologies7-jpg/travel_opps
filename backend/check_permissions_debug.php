<?php
// Test script for checking permissions
// Place this in backend/check_permissions_debug.php
// Run with: php artisan tinker check_permissions_debug.php

use App\Models\User;
use App\Models\Company;
use Spatie\Permission\Models\Permission;
use App\Models\SubscriptionPlanFeature;
use Illuminate\Support\Facades\Log;

try {
    // Assuming user with ID 9 (or similar) is the current company admin
    $user = User::where('email', 'pankaj@local.com')->first(); // Adjust to known user or last logged-in
    if (!$user) {
        $user = User::where('is_super_admin', false)->latest()->first();
    }

    echo "Checking for User: " . $user->name . " (ID: $user->id)\n";
    echo "Is Super Admin: " . ($user->is_super_admin ? 'Yes' : 'No') . "\n";

    if (!$user->company_id) {
        echo "User has no company.\n";
        exit;
    }

    $company = $user->company;
    echo "Company: " . $company->name . " (Plan ID: " . $company->subscription_plan_id . ")\n";

    if (!$company->subscriptionPlan) {
        echo "No Subscription Plan.\n";
        exit;
    }

    echo "Plan: " . $company->subscriptionPlan->name . "\n";

    // 1. Check Plan Features using `planFeatures` relationship (Pivot)
    $pivotFeatures = $company->subscriptionPlan->planFeatures()->wherePivot('is_active', true)->get();
    echo "Plan Features (Pivot Count): " . $pivotFeatures->count() . "\n";
    foreach ($pivotFeatures as $f) {
        echo " - " . $f->key . "\n";
    }

    // 2. Check Plan Features using `permissions` column (JSON array of IDs)
    $permissionIds = $company->subscriptionPlan->permissions;
    echo "Plan Permissions (JSON IDs): " . json_encode($permissionIds) . "\n";

    if (empty($permissionIds)) {
        echo "WARNING: Plan 'permissions' column is empty or null.\n";
    }

    // 3. Permissions logic from CompanySettingsController
    $allowedNames = collect(['view dashboard', 'manage profile']);
    $planFeaturesFromPerms = $company->subscriptionPlan->getEnabledFeaturesFromPermissions();
    echo "Plan Features from JSON (getEnabledFeaturesFromPermissions Count): " . $planFeaturesFromPerms->count() . "\n";

    foreach ($planFeaturesFromPerms as $f) {
        echo " - " . $f->feature_key . " (Key from DB)\n";
    }

    $allowedNames = $allowedNames->merge($planFeaturesFromPerms->pluck('feature_key'));
    echo "Allowed Permission Names: " . $allowedNames->implode(', ') . "\n";

    // 4. Check Spatie Permissions Table
    $allPerms = Permission::all();
    echo "Total Spatie Permissions in DB: " . $allPerms->count() . "\n";
    if ($allPerms->count() === 0) {
        echo "WARNING: No permissions found in `permissions` table.\n";
    } else {
        echo "Permissions in DB: " . $allPerms->pluck('name')->implode(', ') . "\n";
    }

    $finalPermissions = Permission::whereIn('name', $allowedNames)->orderBy('name')->get(['id', 'name']);
    echo "Final Permissions returned to frontend: " . $finalPermissions->count() . "\n";
    foreach ($finalPermissions as $p) {
        echo " - " . $p->name . "\n";
    }

} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString();
}
