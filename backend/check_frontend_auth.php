<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== 🔍 FRONTEND AUTHENTICATION CHECK ===\n\n";

// Create a fresh token for frontend testing
$user = \App\Models\User::where('email', 'travel@yopmail.com')->first(); // Main admin user

if ($user) {
    // Ensure user has Admin role
    $adminRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);
    $user->assignRole('Admin');
    
    // Create fresh token
    $token = $user->createToken('frontend-test')->plainTextToken;
    
    echo "✅ User: {$user->name} ({$user->email})\n";
    echo "✅ Role: Admin\n";
    echo "✅ Token: " . substr($token, 0, 30) . "...\n";
    
    echo "\n📋 Frontend Login Credentials:\n";
    echo "Email: travel@yopmail.com\n";
    echo "Password: (Check your frontend or use existing password)\n";
    echo "Token: $token\n";
    
    echo "\n🧪 API Tests with Fresh Token:\n";
    
    $testApis = [
        ['url' => 'http://127.0.0.1:8000/api/admin/users', 'name' => 'Users API'],
        ['url' => 'http://127.0.0.1:8000/api/dashboard/employee-performance?month=2026-01', 'name' => 'Employee Performance API'],
        ['url' => 'http://127.0.0.1:8000/api/settings', 'name' => 'Settings API']
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
                echo "✅ {$api['name']} - SUCCESS\n";
            } else {
                echo "❌ {$api['name']} - FAILED: " . ($data['message'] ?? 'Unknown error') . "\n";
            }
        } catch (Exception $e) {
            echo "❌ {$api['name']} - EXCEPTION: " . $e->getMessage() . "\n";
        }
    }
    
    echo "\n🔧 FRONTEND FIX INSTRUCTIONS:\n";
    echo "1. Clear browser localStorage and sessionStorage\n";
    echo "2. Login again with email: travel@yopmail.com\n";
    echo "3. Check browser network tab for Authorization header\n";
    echo "4. Verify token is being sent with API requests\n";
    
} else {
    echo "❌ Admin user not found\n";
}

echo "\n=== 🚀 CHECK COMPLETE ===\n";

?>
