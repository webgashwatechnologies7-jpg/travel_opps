<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== 🔍 DEBUGGING CURRENT USER PERMISSIONS ===\n\n";

// Check all users and their roles
echo "1. 📋 All Users and Their Roles:\n";
$users = \App\Models\User::all();

foreach ($users as $user) {
    echo "\n👤 User: {$user->name} ({$user->email})\n";
    echo "   - ID: {$user->id}\n";
    echo "   - Is Super Admin: " . ($user->is_super_admin ? 'YES' : 'NO') . "\n";
    echo "   - Is Active: " . ($user->is_active ? 'YES' : 'NO') . "\n";
    
    // Check roles
    $roles = $user->getRoleNames();
    echo "   - Roles: " . ($roles->isEmpty() ? 'NONE' : $roles->implode(', ')) . "\n";
    
    // Check permissions
    $permissions = $user->getAllPermissions()->pluck('name');
    if ($permissions->isNotEmpty()) {
        echo "   - Key Permissions:\n";
        $keyPermissions = ['manage users', 'view dashboard', 'manage performance'];
        foreach ($keyPermissions as $perm) {
            $has = $user->hasPermissionTo($perm) ? 'YES' : 'NO';
            echo "     * $perm: $has\n";
        }
    }
}

echo "\n2. 🔧 Fixing User Roles:\n";

// Ensure Admin role exists and has permissions
$adminRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);

// Give Admin role all permissions (for development)
$allPermissions = [
    'manage users',
    'view dashboard', 
    'manage performance',
    'manage settings',
    'manage leads',
    'manage payments'
];

foreach ($allPermissions as $permissionName) {
    $permission = \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $permissionName]);
    $adminRole->givePermissionTo($permission);
    echo "✅ Permission '$permissionName' assigned to Admin role\n";
}

// Assign Admin role to all super admin users
$superAdmins = \App\Models\User::where('is_super_admin', true)->get();
foreach ($superAdmins as $user) {
    if (!$user->hasRole('Admin')) {
        $user->assignRole('Admin');
        echo "✅ Admin role assigned to {$user->name}\n";
    }
}

echo "\n3. 🧪 Testing API Access:\n";

// Test with a super admin user
$testUser = \App\Models\User::where('is_super_admin', true)->first();
if ($testUser) {
    $token = $testUser->createToken('debug-access')->plainTextToken;
    
    $testApis = [
        'http://127.0.0.1:8000/api/admin/users',
        'http://127.0.0.1:8000/api/dashboard/employee-performance?month=2026-01'
    ];
    
    foreach ($testApis as $url) {
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
            $response = file_get_contents($url, false, $context);
            $data = json_decode($response, true);
            
            if (isset($data['success']) && $data['success']) {
                echo "✅ $url - SUCCESS\n";
            } else {
                echo "❌ $url - FAILED: " . ($data['message'] ?? 'Unknown error') . "\n";
            }
        } catch (Exception $e) {
            echo "❌ $url - EXCEPTION: " . $e->getMessage() . "\n";
        }
    }
}

echo "\n=== 🚀 DEBUG COMPLETE ===\n";

?>
