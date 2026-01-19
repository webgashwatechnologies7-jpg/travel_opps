<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== Testing Authenticated Payments API ===\n";

// First, create a test user and token
echo "1. Creating test user and token...\n";
try {
    $user = \App\Models\User::where('email', 'test@travelops.com')->first();
    if (!$user) {
        $user = \App\Models\User::create([
            'name' => 'Test User',
            'email' => 'test@travelops.com',
            'password' => \Illuminate\Support\Facades\Hash::make('test123'),
            'is_super_admin' => true,
            'is_active' => true,
            'company_id' => null
        ]);
        echo "✅ Created new test user\n";
    } else {
        echo "✅ Using existing test user\n";
    }
    
    // Create token
    $token = $user->createToken('test-token')->plainTextToken;
    echo "✅ Created token: " . substr($token, 0, 20) . "...\n";
    
} catch (Exception $e) {
    echo "❌ User/token creation error: " . $e->getMessage() . "\n";
    exit(1);
}

// Test API with token
echo "\n2. Testing API with authentication...\n";
try {
    $url = 'http://127.0.0.1:8000/api/payments/due-today';
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Authorization: Bearer ' . $token,
                'Accept: application/json',
                'Content-Type: application/json'
            ],
            'ignore_errors' => true
        ]
    ]);
    
    $response = file_get_contents($url, false, $context);
    
    // Parse response
    $data = json_decode($response, true);
    
    if ($data && isset($data['success'])) {
        echo "✅ API Response:\n";
        echo json_encode($data, JSON_PRETTY_PRINT) . "\n";
    } else {
        echo "❌ Invalid API response:\n";
        echo $response . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ API call error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";

?>
