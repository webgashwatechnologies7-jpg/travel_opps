<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Spatie\Permission\Models\Permission;

echo "=== Permission Check ===" . PHP_EOL;

// Check if manage_company_settings permission exists
$permission = Permission::where('name', 'manage_company_settings')->first();
if ($permission) {
    echo "✓ manage_company_settings permission exists" . PHP_EOL;
} else {
    echo "✗ manage_company_settings permission NOT found" . PHP_EOL;
    echo "Creating permission..." . PHP_EOL;
    Permission::create(['name' => 'manage_company_settings']);
    echo "✓ Permission created successfully" . PHP_EOL;
}

// Get all users
$users = User::all();
echo PHP_EOL . "=== Users and Permissions ===" . PHP_EOL;

foreach ($users as $user) {
    echo PHP_EOL . "User: " . $user->name . " (ID: " . $user->id . ")" . PHP_EOL;
    echo "Email: " . $user->email . PHP_EOL;
    echo "Is Super Admin: " . ($user->is_super_admin ? 'Yes' : 'No') . PHP_EOL;
    echo "Company ID: " . $user->company_id . PHP_EOL;
    
    // Check if user has manage_company_settings permission
    echo "Has manage_company_settings permission: " . ($user->hasPermissionTo('manage_company_settings') ? 'Yes' : 'No') . PHP_EOL;
    
    // List all user permissions
    $userPermissions = $user->permissions->pluck('name')->toArray();
    if (!empty($userPermissions)) {
        echo "User Permissions: " . implode(', ', $userPermissions) . PHP_EOL;
    }
    
    // List user roles
    $userRoles = $user->roles->pluck('name')->toArray();
    if (!empty($userRoles)) {
        echo "User Roles: " . implode(', ', $userRoles) . PHP_EOL;
    }
}

echo PHP_EOL . "=== All Available Permissions ===" . PHP_EOL;
$permissions = Permission::all();
foreach ($permissions as $permission) {
    echo "- " . $permission->name . PHP_EOL;
}

echo PHP_EOL . "=== Check Complete ===" . PHP_EOL;
