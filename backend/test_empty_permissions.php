<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\CompanySettingsController;
use Illuminate\Http\Request;

echo "=== Test Empty Permissions ===" . PHP_EOL;

// Test with empty permissions (like your "tej" role)
$requestData = [
    'name' => 'tej',
    'permissions' => []
];

echo "Testing with empty permissions:" . PHP_EOL;
print_r($requestData);

// Create request object
$request = Request::create('/api/company-settings/roles', 'POST', $requestData);

// Mock authentication
use App\Models\User;
use Illuminate\Support\Facades\Auth;
$user = User::where('email', 'admin@travelcompany.com')->first();
if ($user) {
    Auth::login($user);
    echo "✓ Authenticated as: " . $user->name . PHP_EOL;
}

// Test validation
$validator = validator($requestData, [
    'name' => 'required|string|max:255|unique:roles,name',
    'permissions' => 'nullable|array',
    'permissions.*' => 'string'
]);

if ($validator->fails()) {
    echo "✗ Validation failed:" . PHP_EOL;
    foreach ($validator->errors()->all() as $error) {
        echo "- " . $error . PHP_EOL;
    }
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
}

echo PHP_EOL . "=== Test Complete ===" . PHP_EOL;
