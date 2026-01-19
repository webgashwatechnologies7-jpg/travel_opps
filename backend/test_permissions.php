<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== Testing User Permissions ===\n";

// Get test user
$user = \App\Models\User::where('email', 'test@travelops.com')->first();
if (!$user) {
    echo "❌ Test user not found\n";
    exit(1);
}

echo "✅ User found: {$user->name} ({$user->email})\n";
echo "   - Is Super Admin: " . ($user->is_super_admin ? 'YES' : 'NO') . "\n";
echo "   - Is Active: " . ($user->is_active ? 'YES' : 'NO') . "\n";

// Check roles
echo "\n=== Checking Roles ===\n";
try {
    $roles = $user->roles;
    echo "User roles:\n";
    foreach ($roles as $role) {
        echo "  - {$role->name}\n";
    }
    
    if ($roles->isEmpty()) {
        echo "  ⚠️ No roles assigned\n";
        
        // Assign Admin role if super admin
        if ($user->is_super_admin) {
            echo "  🔧 Assigning Admin role...\n";
            $adminRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);
            $user->assignRole('Admin');
            echo "  ✅ Admin role assigned\n";
        }
    }
    
    // Check specific permissions
    echo "\n=== Checking Permissions ===\n";
    echo "Can manage users: " . ($user->hasPermissionTo('manage users') ? 'YES' : 'NO') . "\n";
    echo "Has Admin role: " . ($user->hasRole('Admin') ? 'YES' : 'NO') . "\n";
    
} catch (Exception $e) {
    echo "❌ Permission check error: " . $e->getMessage() . "\n";
}

// Test API access with token
echo "\n=== Testing API Access ===\n";
try {
    $token = $user->createToken('test-permissions')->plainTextToken;
    echo "✅ Token created\n";
    
    // Test settings API
    $settingsUrl = 'http://127.0.0.1:8000/api/settings';
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Authorization: Bearer ' . $token,
                'Accept: application/json'
            ],
            'ignore_errors' => true
        ]
    ]);
    
    $response = file_get_contents($settingsUrl, false, $context);
    $data = json_decode($response, true);
    
    if (isset($data['success'])) {
        echo "✅ Settings API: " . ($data['success'] ? 'SUCCESS' : 'FAILED') . "\n";
    } else {
        echo "❌ Settings API: INVALID RESPONSE\n";
    }
    
    // Test users API
    $usersUrl = 'http://127.0.0.1:8000/api/admin/users';
    $response = file_get_contents($usersUrl, false, $context);
    $data = json_decode($response, true);
    
    if (isset($data['success'])) {
        echo "✅ Users API: " . ($data['success'] ? 'SUCCESS' : 'FAILED') . "\n";
    } else {
        echo "❌ Users API: INVALID RESPONSE\n";
        echo "Response: " . substr($response, 0, 200) . "...\n";
    }
    
} catch (Exception $e) {
    echo "❌ API test error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";

?>
