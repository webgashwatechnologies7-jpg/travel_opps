<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== Testing API Routes ===\n";

// Test basic API
echo "1. Testing basic API...\n";
$response = file_get_contents('http://127.0.0.1:8000/api/test-unique');
echo "Response: " . $response . "\n\n";

// Test auth API
echo "2. Testing auth API...\n";
$response = file_get_contents('http://127.0.0.1:8000/api/auth/login', false, stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => 'Content-Type: application/json',
        'content' => json_encode(['email' => 'test@test.com', 'password' => 'test'])
    ]
]));
echo "Response: " . $response . "\n\n";

// Test super admin API
echo "3. Testing super admin API...\n";
$response = file_get_contents('http://127.0.0.1:8000/api/super-admin/companies');
echo "Response: " . $response . "\n\n";

echo "4. Testing subscription plans API...\n";
$response = file_get_contents('http://127.0.0.1:8000/api/super-admin/subscription-plans');
echo "Response: " . $response . "\n\n";

echo "=== API Test Complete ===\n";
