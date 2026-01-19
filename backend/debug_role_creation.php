<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\CompanySettingsController;
use Illuminate\Http\Request;

echo "=== Debug Role Creation ===" . PHP_EOL;

// Simulate the request that's failing
$requestData = [
    'name' => 'Test',
    'permissions' => ['create_user', 'edit_user', 'delete_user']
];

echo "Request Data:" . PHP_EOL;
print_r($requestData);

// Create request object
$request = Request::create('/api/company-settings/roles', 'POST', $requestData);

// Validate the request
$validator = validator($requestData, [
    'name' => 'required|string|max:255|unique:roles,name',
    'permissions' => 'required|array',
    'permissions.*' => 'string'
]);

if ($validator->fails()) {
    echo "Validation Errors:" . PHP_EOL;
    foreach ($validator->errors()->all() as $error) {
        echo "- " . $error . PHP_EOL;
    }
} else {
    echo "✓ Validation passed" . PHP_EOL;
}

// Check if role name already exists
use Spatie\Permission\Models\Role;
$existingRole = Role::where('name', 'Test')->first();
if ($existingRole) {
    echo "✗ Role 'Test' already exists with ID: " . $existingRole->id . PHP_EOL;
} else {
    echo "✓ Role name 'Test' is available" . PHP_EOL;
}

// Check if permissions exist
use Spatie\Permission\Models\Permission;
$requiredPermissions = ['create_user', 'edit_user', 'delete_user'];
echo PHP_EOL . "Checking permissions:" . PHP_EOL;
foreach ($requiredPermissions as $permName) {
    $perm = Permission::where('name', $permName)->first();
    if ($perm) {
        echo "✓ Permission '{$permName}' exists" . PHP_EOL;
    } else {
        echo "✗ Permission '{$permName}' NOT found" . PHP_EOL;
    }
}

echo PHP_EOL . "=== Debug Complete ===" . PHP_EOL;
