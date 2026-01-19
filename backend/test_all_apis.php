<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== Testing All API Endpoints ===\n";

// Get authenticated user
$user = \App\Models\User::where('email', 'test@travelops.com')->first();
if (!$user) {
    echo "❌ Test user not found\n";
    exit(1);
}

// Ensure user has Admin role
$adminRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);
$user->assignRole('Admin');

$token = $user->createToken('test-all-apis')->plainTextToken;

$context = stream_context_create([
    'http' => [
        'header' => [
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
            'Content-Type: application/json'
        ],
        'ignore_errors' => true
    ]
]);

$baseUrl = 'http://127.0.0.1:8000/api';

$apis = [
    // Auth APIs
    'auth/profile' => 'GET',
    
    // Dashboard APIs
    'dashboard/stats' => 'GET',
    'dashboard/revenue-growth-monthly' => 'GET',
    'dashboard/upcoming-tours' => 'GET',
    'dashboard/latest-lead-notes' => 'GET',
    'dashboard/sales-reps-stats' => 'GET',
    'dashboard/top-destinations' => 'GET',
    'dashboard/employee-performance' => 'GET',
    
    // Settings APIs
    'settings' => 'GET',
    'settings/max-hotel-options' => 'GET',
    
    // CRM APIs
    'admin/users' => 'GET',
    'profile' => 'GET',
    
    // Finance APIs
    'payments/due-today' => 'GET',
    'payments/pending' => 'GET',
    
    // Leads APIs
    'leads' => 'GET',
    'followups/today' => 'GET',
    
    // Operations APIs
    'packages' => 'GET',
    'destinations' => 'GET',
];

echo "Testing " . count($apis) . " API endpoints...\n\n";

$successCount = 0;
$errorCount = 0;

foreach ($apis as $endpoint => $method) {
    $url = $baseUrl . '/' . $endpoint;
    
    try {
        $context = stream_context_create([
            'http' => [
                'method' => $method,
                'header' => [
                    'Authorization: Bearer ' . $token,
                    'Accept: application/json',
                    'Content-Type: application/json'
                ],
                'ignore_errors' => true
            ]
        ]);
        
        $response = file_get_contents($url, false, $context);
        $data = json_decode($response, true);
        
        if (isset($data['success']) && $data['success']) {
            echo "✅ $method $endpoint - SUCCESS\n";
            $successCount++;
        } elseif (isset($data['success']) && !$data['success']) {
            echo "❌ $method $endpoint - FAILED: " . ($data['message'] ?? 'Unknown error') . "\n";
            $errorCount++;
        } else {
            echo "⚠️ $method $endpoint - INVALID RESPONSE\n";
            $errorCount++;
        }
        
    } catch (Exception $e) {
        echo "❌ $method $endpoint - EXCEPTION: " . $e->getMessage() . "\n";
        $errorCount++;
    }
}

echo "\n=== Test Summary ===\n";
echo "✅ Successful: $successCount\n";
echo "❌ Failed: $errorCount\n";
echo "📊 Total: " . ($successCount + $errorCount) . "\n";

if ($errorCount > 0) {
    echo "\n⚠️ Some APIs are failing. Check the errors above.\n";
} else {
    echo "\n🎉 All APIs are working correctly!\n";
}

?>
