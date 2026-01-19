<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== 🧪 TESTING COMPANY ADMIN SYSTEM ===\n\n";

// Test 1: Check subscription plans
echo "1. 💳 Testing Subscription Plans:\n";
try {
    $plans = \App\Models\SubscriptionPlan::with(['features' => function ($query) {
        $query->where('is_enabled', true);
    }])->where('is_active', true)->get();
    
    foreach ($plans as $plan) {
        echo "\n📋 {$plan->name} ({$plan->slug}):\n";
        echo "   Price: \${$plan->price}/{$plan->billing_period}\n";
        echo "   Max Users: " . ($plan->max_users ?? 'Unlimited') . "\n";
        echo "   Max Leads: " . ($plan->max_leads ?? 'Unlimited') . "\n";
        echo "   Features: " . $plan->features->count() . " enabled\n";
        
        foreach ($plan->features as $feature) {
            echo "     ✅ {$feature->feature_name}\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

// Test 2: Check company admin user
echo "\n2. 👤 Testing Company Admin User:\n";
try {
    $companyAdmin = \App\Models\User::where('email', 'admin@travelcompany.com')->first();
    
    if ($companyAdmin) {
        echo "✅ Company Admin Found: {$companyAdmin->name}\n";
        echo "   Email: {$companyAdmin->email}\n";
        echo "   Company: {$companyAdmin->company->name}\n";
        echo "   Roles: " . $companyAdmin->getRoleNames()->implode(', ') . "\n";
        echo "   Permissions: " . $companyAdmin->getAllPermissions()->count() . " total\n";
        
        // Show key permissions
        $keyPermissions = ['dashboard', 'leads', 'analytics', 'whatsapp'];
        foreach ($keyPermissions as $perm) {
            $has = $companyAdmin->hasPermissionTo($perm) ? 'YES' : 'NO';
            echo "     - $perm: $has\n";
        }
        
        // Test API access
        echo "\n🔗 Testing API Access:\n";
        $token = $companyAdmin->createToken('test-company-admin')->plainTextToken;
        
        $testApis = [
            ['url' => 'http://127.0.0.1:8000/api/dashboard/stats', 'name' => 'Dashboard Stats'],
            ['url' => 'http://127.0.0.1:8000/api/settings', 'name' => 'Settings'],
            ['url' => 'http://127.0.0.1:8000/api/leads', 'name' => 'Leads'],
        ];
        
        foreach ($testApis as $api) {
            $context = stream_context_create([
                'http' => [
                    'header' => [
                        'Authorization: Bearer ' . $token,
                        'Accept: application/json'
                    ],
                    'ignore_errors' => true
                ]
            ]);
            
            try {
                $response = file_get_contents($api['url'], false, $context);
                $data = json_decode($response, true);
                
                if (isset($data['success']) && $data['success']) {
                    echo "   ✅ {$api['name']} - SUCCESS\n";
                } else {
                    echo "   ❌ {$api['name']} - FAILED: " . ($data['message'] ?? 'Unknown') . "\n";
                }
            } catch (Exception $e) {
                echo "   ❌ {$api['name']} - ERROR\n";
            }
        }
        
    } else {
        echo "❌ Company Admin not found\n";
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}

// Test 3: Test company admin creation API
echo "\n3. 🏢 Testing Company Admin Creation API:\n";
try {
    $superAdmin = \App\Models\User::where('is_super_admin', true)->first();
    $token = $superAdmin->createToken('test-super-admin')->plainTextToken;
    
    $newCompanyData = [
        'company_name' => 'Test Travel Agency',
        'company_email' => 'info@testtravel.com',
        'admin_name' => 'Test Admin',
        'admin_email' => 'admin@testtravel.com',
        'admin_password' => 'test123456',
        'subscription_plan_id' => 1, // Basic plan
        'subscription_start_date' => now()->toDateString(),
        'subscription_end_date' => now()->addMonth()->toDateString(),
    ];
    
    $context = stream_context_create([
        'http' => [
            'method' => 'POST',
            'header' => [
                'Authorization: Bearer ' . $token,
                'Accept: application/json',
                'Content-Type: application/json'
            ],
            'content' => json_encode($newCompanyData),
            'ignore_errors' => true
        ]
    ]);
    
    $response = file_get_contents('http://127.0.0.1:8000/api/company-admin/create', false, $context);
    $data = json_decode($response, true);
    
    if (isset($data['success']) && $data['success']) {
        echo "✅ Company Admin Creation - SUCCESS\n";
        echo "   Company: {$data['data']['company']['name']}\n";
        echo "   Admin: {$data['data']['admin_user']['name']}\n";
        echo "   Plan: {$data['data']['company']['subscription_plan']['name']}\n";
    } else {
        echo "❌ Company Admin Creation - FAILED\n";
        echo "   Error: " . ($data['message'] ?? 'Unknown') . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ API Test Error: " . $e->getMessage() . "\n";
}

echo "\n=== 🎯 USAGE INSTRUCTIONS ===\n";
echo "\n📋 How to Create Company Admin:\n";
echo "1. Login as Super Admin\n";
echo "2. Use API: POST /api/company-admin/create\n";
echo "3. Required fields:\n";
echo "   - company_name, company_email\n";
echo "   - admin_name, admin_email, admin_password\n";
echo "   - subscription_plan_id\n";
echo "   - subscription_start_date, subscription_end_date\n";

echo "\n🔑 Available Logins:\n";
echo "Super Admin: travel@yopmail.com\n";
echo "Company Admin: admin@travelcompany.com / admin123\n";

echo "\n💡 Plan-Based Access:\n";
echo "- Basic Plan: Dashboard, Leads, Profile\n";
echo "- Professional Plan: + Analytics, Email Templates, Followups\n";
echo "- Enterprise Plan: + WhatsApp, API Access, Multi-Branch, White Label\n";

echo "\n=== 🚀 TEST COMPLETE ===\n";

?>
