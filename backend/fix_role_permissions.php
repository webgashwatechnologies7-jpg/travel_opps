<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

echo "=== Fix Role Permissions ===" . PHP_EOL;

// Get Company Admin role
$companyAdminRole = Role::where('name', 'Company Admin')->first();
if ($companyAdminRole) {
    echo "✓ Found Company Admin role" . PHP_EOL;
    
    // Add manage_company_settings permission to Company Admin role
    $permission = Permission::where('name', 'manage_company_settings')->first();
    if ($permission) {
        $companyAdminRole->givePermissionTo($permission);
        echo "✓ Added manage_company_settings permission to Company Admin role" . PHP_EOL;
    }
    
    // Also add user management permissions
    $userPermissions = ['create_user', 'edit_user', 'delete_user'];
    foreach ($userPermissions as $permName) {
        $perm = Permission::where('name', $permName)->first();
        if ($perm) {
            $companyAdminRole->givePermissionTo($perm);
            echo "✓ Added {$permName} permission to Company Admin role" . PHP_EOL;
        }
    }
    
    // Also add branch management permissions
    $branchPermissions = ['create_branch', 'edit_branch', 'delete_branch'];
    foreach ($branchPermissions as $permName) {
        $perm = Permission::where('name', $permName)->first();
        if ($perm) {
            $companyAdminRole->givePermissionTo($perm);
            echo "✓ Added {$permName} permission to Company Admin role" . PHP_EOL;
        }
    }
    
} else {
    echo "✗ Company Admin role not found" . PHP_EOL;
}

// Update specific Company Admin user (ID: 10)
$user = User::find(10);
if ($user && $user->hasRole('Company Admin')) {
    echo PHP_EOL . "✓ Found Company Admin user: " . $user->email . PHP_EOL;
    
    // Refresh permissions
    $user->refresh();
    
    // Check permissions after update
    echo "Updated permissions:" . PHP_EOL;
    echo "- manage_company_settings: " . ($user->hasPermissionTo('manage_company_settings') ? 'Yes' : 'No') . PHP_EOL;
    echo "- create_user: " . ($user->hasPermissionTo('create_user') ? 'Yes' : 'No') . PHP_EOL;
    echo "- edit_user: " . ($user->hasPermissionTo('edit_user') ? 'Yes' : 'No') . PHP_EOL;
    echo "- delete_user: " . ($user->hasPermissionTo('delete_user') ? 'Yes' : 'No') . PHP_EOL;
}

echo PHP_EOL . "=== Fix Complete ===" . PHP_EOL;
echo "Now try to create the role again!" . PHP_EOL;
