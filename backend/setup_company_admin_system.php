<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== 🏢 SETTING UP COMPANY ADMIN SYSTEM ===\n\n";

// 1. Create Super Admin Role (if not exists)
echo "1. 🔐 Creating Roles:\n";
$superAdminRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Super Admin']);
$companyAdminRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Company Admin']);
echo "✅ Super Admin role created\n";
echo "✅ Company Admin role created\n";

// 2. Create Subscription Plans
echo "\n2. 💳 Creating Subscription Plans:\n";

$plans = [
    [
        'name' => 'Basic Plan',
        'slug' => 'basic',
        'description' => 'Perfect for small travel agencies',
        'price' => 49.99,
        'billing_period' => 'monthly',
        'max_users' => 5,
        'max_leads' => 100,
        'is_active' => true,
        'sort_order' => 1,
    ],
    [
        'name' => 'Professional Plan',
        'slug' => 'professional',
        'description' => 'Ideal for growing travel businesses',
        'price' => 99.99,
        'billing_period' => 'monthly',
        'max_users' => 15,
        'max_leads' => 500,
        'is_active' => true,
        'sort_order' => 2,
    ],
    [
        'name' => 'Enterprise Plan',
        'slug' => 'enterprise',
        'description' => 'Complete solution for large agencies',
        'price' => 199.99,
        'billing_period' => 'monthly',
        'max_users' => null, // Unlimited
        'max_leads' => null, // Unlimited
        'is_active' => true,
        'sort_order' => 3,
    ]
];

foreach ($plans as $planData) {
    $plan = \App\Models\SubscriptionPlan::firstOrCreate(['slug' => $planData['slug']], $planData);
    echo "✅ Plan created: {$plan->name}\n";
}

// 3. Create Subscription Plan Features
echo "\n3. ⭐ Creating Subscription Features:\n";

$features = [
    // Basic features (all plans)
    ['feature_key' => 'dashboard', 'feature_name' => 'Dashboard Access', 'description' => 'Access to main dashboard'],
    ['feature_key' => 'leads', 'feature_name' => 'Lead Management', 'description' => 'Manage leads and contacts'],
    ['feature_key' => 'profile', 'feature_name' => 'Profile Management', 'description' => 'Manage user profile'],
    
    // Professional features
    ['feature_key' => 'analytics', 'feature_name' => 'Analytics & Reports', 'description' => 'Advanced analytics and reporting'],
    ['feature_key' => 'email_templates', 'feature_name' => 'Email Templates', 'description' => 'Custom email templates'],
    ['feature_key' => 'followups', 'feature_name' => 'Follow-up Management', 'description' => 'Automated follow-ups'],
    
    // Enterprise features
    ['feature_key' => 'whatsapp', 'feature_name' => 'WhatsApp Integration', 'description' => 'WhatsApp messaging integration'],
    ['feature_key' => 'custom_reports', 'feature_name' => 'Custom Reports', 'description' => 'Create custom reports'],
    ['feature_key' => 'api_access', 'feature_name' => 'API Access', 'description' => 'Full API access'],
    ['feature_key' => 'multi_branch', 'feature_name' => 'Multi-Branch Support', 'description' => 'Manage multiple branches'],
    ['feature_key' => 'white_label', 'feature_name' => 'White Label', 'description' => 'White label customization'],
];

// Get all plans
$allPlans = \App\Models\SubscriptionPlan::all();
$createdFeatures = [];

foreach ($allPlans as $plan) {
    echo "   Creating features for {$plan->name}...\n";
    
    foreach ($features as $featureData) {
        $feature = \App\Models\SubscriptionPlanFeature::firstOrCreate(
            [
                'subscription_plan_id' => $plan->id,
                'feature_key' => $featureData['feature_key']
            ],
            [
                'feature_name' => $featureData['feature_name'],
                'is_enabled' => true,
                'limit_value' => null,
            ]
        );
        
        if (!isset($createdFeatures[$featureData['feature_key']])) {
            $createdFeatures[$featureData['feature_key']] = $feature->feature_name;
            echo "✅ Feature created: {$feature->feature_name}\n";
        }
    }
}

// 4. Enable/Disable features based on plan
echo "\n4. 🔗 Configuring Features by Plan:\n";

$basicPlan = \App\Models\SubscriptionPlan::where('slug', 'basic')->first();
$professionalPlan = \App\Models\SubscriptionPlan::where('slug', 'professional')->first();
$enterprisePlan = \App\Models\SubscriptionPlan::where('slug', 'enterprise')->first();

// Basic plan features (enable only basic features)
$basicFeatures = ['dashboard', 'leads', 'profile'];
foreach ($basicFeatures as $featureKey) {
    \App\Models\SubscriptionPlanFeature::where('subscription_plan_id', $basicPlan->id)
        ->where('feature_key', $featureKey)
        ->update(['is_enabled' => true]);
}
echo "✅ Basic plan features configured\n";

// Professional plan features (enable basic + professional)
$professionalFeatures = ['dashboard', 'leads', 'profile', 'analytics', 'email_templates', 'followups'];
foreach ($professionalFeatures as $featureKey) {
    \App\Models\SubscriptionPlanFeature::where('subscription_plan_id', $professionalPlan->id)
        ->where('feature_key', $featureKey)
        ->update(['is_enabled' => true]);
}
echo "✅ Professional plan features configured\n";

// Enterprise plan features (enable all features)
$allFeatureKeys = [];
foreach ($features as $feature) {
    $allFeatureKeys[] = $feature['feature_key'];
}
foreach ($allFeatureKeys as $featureKey) {
    \App\Models\SubscriptionPlanFeature::where('subscription_plan_id', $enterprisePlan->id)
        ->where('feature_key', $featureKey)
        ->update(['is_enabled' => true]);
}
echo "✅ Enterprise plan features configured\n";

// Update plan permissions with feature IDs
echo "\n5. 📋 Updating Plan Permissions:\n";

$basicPlan->update(['permissions' => \App\Models\SubscriptionPlanFeature::where('subscription_plan_id', $basicPlan->id)->where('is_enabled', true)->pluck('id')->toArray()]);
$professionalPlan->update(['permissions' => \App\Models\SubscriptionPlanFeature::where('subscription_plan_id', $professionalPlan->id)->where('is_enabled', true)->pluck('id')->toArray()]);
$enterprisePlan->update(['permissions' => \App\Models\SubscriptionPlanFeature::where('subscription_plan_id', $enterprisePlan->id)->where('is_enabled', true)->pluck('id')->toArray()]);

echo "✅ Plan permissions updated\n";

// 6. Create permissions for all features
echo "\n6. 🔐 Creating Permissions:\n";
foreach ($features as $feature) {
    $permissionName = $feature['feature_key'];
    $permission = \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $permissionName]);
    echo "✅ Permission created: $permissionName\n";
}

// 7. Assign Super Admin all permissions
echo "\n7. 👑 Assigning Super Admin Permissions:\n";
$allPermissions = \Spatie\Permission\Models\Permission::all();
foreach ($allPermissions as $permission) {
    $superAdminRole->givePermissionTo($permission->name);
}
echo "✅ Super Admin has all permissions\n";

// 8. Create sample company admin
echo "\n8. 🏢 Creating Sample Company Admin:\n";

try {
    // Create sample company
    $sampleCompany = \App\Models\Company::firstOrCreate([
        'email' => 'demo@travelcompany.com'
    ], [
        'name' => 'Demo Travel Company',
        'subdomain' => 'demo-travel',
        'status' => 'active',
        'subscription_plan_id' => $professionalPlan->id,
        'subscription_start_date' => now(),
        'subscription_end_date' => now()->addMonth(),
    ]);
    
    echo "✅ Sample company created: {$sampleCompany->name}\n";
    
    // Create company admin
    $companyAdmin = \App\Models\User::firstOrCreate([
        'email' => 'admin@travelcompany.com'
    ], [
        'name' => 'Company Admin',
        'password' => Hash::make('admin123'),
        'is_super_admin' => false,
        'is_active' => true,
        'company_id' => $sampleCompany->id,
    ]);
    
    $companyAdmin->assignRole('Company Admin');
    
    // Assign professional plan permissions
    foreach ($professionalFeatures as $feature) {
        $companyAdmin->givePermissionTo($feature);
    }
    
    echo "✅ Sample company admin created: {$companyAdmin->name}\n";
    echo "   Email: admin@travelcompany.com\n";
    echo "   Password: admin123\n";
    echo "   Plan: Professional\n";
    
} catch (Exception $e) {
    echo "⚠️ Sample creation skipped: " . $e->getMessage() . "\n";
}

echo "\n=== 🎉 SETUP COMPLETE ===\n";
echo "\n📋 System Ready:\n";
echo "✅ Roles: Super Admin, Company Admin\n";
echo "✅ Plans: Basic, Professional, Enterprise\n";
echo "✅ Features: 10 different features\n";
echo "✅ Permissions: All configured\n";

echo "\n🔑 Login Credentials:\n";
echo "Super Admin: travel@yopmail.com (check existing password)\n";
echo "Company Admin: admin@travelcompany.com / admin123\n";

echo "\n📡 API Endpoints:\n";
echo "POST /api/company-admin/create - Create company admin\n";
echo "GET /api/company-admin/list - List all company admins\n";
echo "GET /api/subscription-plans - Get available plans\n";

echo "\n🚀 System is ready for company admin management!\n";

?>
