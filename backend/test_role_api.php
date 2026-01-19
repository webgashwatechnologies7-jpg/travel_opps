<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\CompanySettingsController;
use Illuminate\Http\Request;

echo "=== Test Role API ===" . PHP_EOL;

// Test the exact request that frontend sends
$requestData = [
    'name' => 'Test',
    'permissions' => ['create_user', 'edit_user', 'delete_user']
];

echo "Testing with data:" . PHP_EOL;
print_r($requestData);

// Create request object
$request = Request::create('/api/company-settings/roles', 'POST', $requestData);

// Mock authentication
use App\Models\User;
$user = User::where('email', 'admin@travelcompany.com')->first();
if ($user) {
    Auth::login($user);
    echo "✓ Authenticated as: " . $user->name . PHP_EOL;
    echo "✓ Has manage_company_settings: " . ($user->hasPermissionTo('manage_company_settings') ? 'Yes' : 'No') . PHP_EOL;
} else {
    echo "✗ User not found" . PHP_EOL;
    exit;
}

// Test validation
$validator = validator($requestData, [
    'name' => 'required|string|max:255|unique:roles,name',
    'permissions' => 'required|array',
    'permissions.*' => 'string'
]);

if ($validator->fails()) {
    echo "✗ Validation failed:" . PHP_EOL;
    foreach ($validator->errors()->all() as $error) {
        echo "- " . $error . PHP_EOL;
    }
    exit;
} else {
    echo "✓ Validation passed" . PHP_EOL;
}

// Test actual role creation
try {
    $controller = new CompanySettingsController();
    $response = $controller->createRole($request);
    
    echo "✓ Role creation successful!" . PHP_EOL;
    echo "Response: " . $response->getContent() . PHP_EOL;
    
} catch (\Exception $e) {
    echo "✗ Role creation failed: " . $e->getMessage() . PHP_EOL;
    echo "File: " . $e->getFile() . ":" . $e->getLine() . PHP_EOL;
}

echo PHP_EOL . "=== Test Complete ===" . PHP_EOL;
