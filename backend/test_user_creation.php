<?php

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\CompanySettingsController;
use Illuminate\Http\Request;

echo "=== Test User Creation ===" . PHP_EOL;

// Test with exact data from frontend
$requestData = [
    'name' => 'Paras Jaswal',
    'email' => 'parasjaswal@yoprmail.com',
    'phone' => '9805598988',
    'employee_id' => 'P2709',
    'branch_id' => null, // No branch selected
    'roles' => [], // No roles selected
    'password' => 'password123',
    'is_active' => true
];

echo "Testing with data:" . PHP_EOL;
print_r($requestData);

// Create request object
$request = Request::create('/api/company-settings/users', 'POST', $requestData);

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
    'name' => 'required|string|max:255',
    'email' => 'required|string|email|max:255|unique:users,email,NULL,id,company_id,' . Auth::user()->company_id,
    'phone' => 'nullable|string|max:20',
    'password' => 'required|string|min:8',
    'branch_id' => 'nullable|exists:branches,id,company_id,' . Auth::user()->company_id,
    'roles' => 'nullable|array',
    'roles.*' => 'exists:roles,name',
    'is_active' => 'boolean'
]);

if ($validator->fails()) {
    echo "✗ Validation failed:" . PHP_EOL;
    foreach ($validator->errors()->all() as $error) {
        echo "- " . $error . PHP_EOL;
    }
} else {
    echo "✓ Validation passed" . PHP_EOL;
}

// Test actual user creation
try {
    $controller = new CompanySettingsController();
    $response = $controller->createUser($request);
    
    echo "✓ User creation successful!" . PHP_EOL;
    echo "Response: " . $response->getContent() . PHP_EOL;
    
} catch (\Exception $e) {
    echo "✗ User creation failed: " . $e->getMessage() . PHP_EOL;
    echo "File: " . $e->getFile() . ":" . $e->getLine() . PHP_EOL;
}

echo PHP_EOL . "=== Test Complete ===" . PHP_EOL;
