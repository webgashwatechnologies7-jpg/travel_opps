<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== Testing Employee Performance API ===\n";

// Get authenticated user
$user = \App\Models\User::where('email', 'test@travelops.com')->first();
$token = $user->createToken('test-employee-performance')->plainTextToken;

// Test with proper month parameter
$url = 'http://127.0.0.1:8000/api/dashboard/employee-performance?month=2026-01';
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

try {
    $response = file_get_contents($url, false, $context);
    $data = json_decode($response, true);
    
    if (isset($data['success']) && $data['success']) {
        echo "✅ Employee Performance API: SUCCESS\n";
        echo "   Month: " . $data['data']['month'] . "\n";
        echo "   Employees: " . $data['data']['total_employees'] . "\n";
    } else {
        echo "❌ Employee Performance API: FAILED\n";
        echo "   Error: " . ($data['message'] ?? 'Unknown') . "\n";
        if (isset($data['errors'])) {
            echo "   Validation Errors:\n";
            foreach ($data['errors'] as $field => $errors) {
                echo "     - $field: " . implode(', ', $errors) . "\n";
            }
        }
    }
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";

?>
