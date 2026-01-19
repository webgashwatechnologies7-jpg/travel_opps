<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== 🔍 FRONTEND TOKEN DEBUG ===\n\n";

// Check what user is currently logged in from frontend perspective
echo "1. 📋 Checking Current Authenticated User:\n";

// Simulate frontend request - check if there's a valid token
$token = null;

// Check if we can get user from a token (simulate frontend)
try {
    // First, let's see all users and their tokens
    $users = \App\Models\User::where('is_active', true)->get();
    
    echo "Active Users:\n";
    foreach ($users as $user) {
        echo "  - {$user->name} ({$user->email})\n";
        echo "    Roles: " . ($user->getRoleNames()->isEmpty() ? 'NONE' : $user->getRoleNames()->implode(', ')) . "\n";
        
        // Check if user has active tokens
        $tokens = $user->tokens()->get();
        echo "    Active Tokens: " . $tokens->count() . "\n";
    }
    
    echo "\n2. 🔧 Creating Fresh Admin Token:\n";
    
    // Get the main admin user
    $adminUser = \App\Models\User::where('email', 'travel@yopmail.com')->first();
    
    if ($adminUser) {
        // Ensure admin role
        $adminRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);
        $adminUser->assignRole('Admin');
        
        // Revoke all old tokens
        $adminUser->tokens()->delete();
        
        // Create fresh token
        $token = $adminUser->createToken('frontend-debug')->plainTextToken;
        
        echo "✅ Admin User: {$adminUser->name}\n";
        echo "✅ Admin Role: Assigned\n";
        echo "✅ Fresh Token: " . substr($token, 0, 30) . "...\n";
        
        echo "\n3. 🧪 Testing Problematic APIs:\n";
        
        $problemApis = [
            ['url' => 'http://127.0.0.1:8000/api/admin/settings', 'name' => 'Admin Settings API'],
            ['url' => 'http://127.0.0.1:8000/api/dashboard/employee-performance?month=2026-01', 'name' => 'Employee Performance API'],
            ['url' => 'http://127.0.0.1:8000/api/settings', 'name' => 'Settings API']
        ];
        
        foreach ($problemApis as $api) {
            $context = stream_context_create([
                'http' => [
                    'header' => [
                        'Authorization: Bearer ' . $token,
                        'Accept: application/json',
                        'Content-Type: application/json'
                    ],
                    'ignore_errors' => true
                ]
            ]);
            
            try {
                $response = file_get_contents($api['url'], false, $context);
                $httpCode = $http_response_header[0] ?? 'Unknown';
                $data = json_decode($response, true);
                
                echo "📡 {$api['name']}:\n";
                echo "   Status: $httpCode\n";
                
                if (isset($data['success']) && $data['success']) {
                    echo "   Result: ✅ SUCCESS\n";
                } else {
                    echo "   Result: ❌ FAILED\n";
                    if (isset($data['message'])) {
                        echo "   Error: " . $data['message'] . "\n";
                    }
                }
                echo "\n";
            } catch (Exception $e) {
                echo "❌ {$api['name']} - EXCEPTION: " . $e->getMessage() . "\n\n";
            }
        }
        
        echo "4. 🔧 FRONTEND FIX INSTRUCTIONS:\n";
        echo "Please follow these steps EXACTLY:\n";
        echo "\n📱 Browser Steps:\n";
        echo "1. Open Chrome DevTools (F12)\n";
        echo "2. Go to Application tab\n";
        echo "3. Local Storage → Clear All\n";
        echo "4. Session Storage → Clear All\n";
        echo "5. Refresh the page\n";
        echo "6. Login with: travel@yopmail.com\n";
        echo "7. Check Network tab for Authorization headers\n";
        
        echo "\n🔑 Use This Token for Testing:\n";
        echo "Token: $token\n";
        echo "Add to Authorization header: Bearer $token\n";
        
    } else {
        echo "❌ Admin user not found\n";
    }
    
} catch (Exception $e) {
    echo "❌ Debug error: " . $e->getMessage() . "\n";
}

echo "\n=== 🚀 DEBUG COMPLETE ===\n";

?>
