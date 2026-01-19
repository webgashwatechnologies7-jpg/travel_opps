<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== 🔍 CHECKING EMPLOYEE PERFORMANCE API RESPONSE ===\n\n";

// Get authenticated user
$user = \App\Models\User::where('email', 'travel@yopmail.com')->first();
if (!$user) {
    echo "❌ User not found\n";
    exit;
}

$token = $user->createToken('check-response')->plainTextToken;

echo "🔑 Testing API response structure...\n";

// Test API call
try {
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
    
    $response = file_get_contents('http://127.0.0.1:8000/api/dashboard/employee-performance', false, $context);
    $data = json_decode($response, true);
    
    echo "\n📊 API Response Structure:\n";
    echo json_encode($data, JSON_PRETTY_PRINT) . "\n\n";
    
    if (isset($data['success']) && $data['success']) {
        echo "✅ API Success\n";
        echo "Data Structure:\n";
        
        if (isset($data['data']['employees'])) {
            echo "  - employees: " . gettype($data['data']['employees']) . "\n";
            echo "  - employees count: " . (is_array($data['data']['employees']) ? count($data['data']['employees']) : 'N/A') . "\n";
            
            if (is_array($data['data']['employees']) && count($data['data']['employees']) > 0) {
                echo "  - First employee structure:\n";
                echo "    " . json_encode($data['data']['employees'][0], JSON_PRETTY_PRINT) . "\n";
            }
        } else {
            echo "  - employees key not found in data\n";
            echo "  - Available keys: " . implode(', ', array_keys($data['data'])) . "\n";
        }
    } else {
        echo "❌ API Failed: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
    
} catch (Exception $e) {
    echo "❌ Exception: " . $e->getMessage() . "\n";
}

echo "\n=== 🎯 FRONTEND FIX NEEDED ===\n";
echo "The frontend expects:\n";
echo "  performance = [] (array of employees)\n\n";

echo "But backend returns:\n";
echo "  data.employees = [] (array of employees)\n\n";

echo "📝 Solution:\n";
echo "In EmployeePerformance.jsx line 16:\n";
echo "Change: setPerformance(response.data.data || []);\n";
echo "To: setPerformance(response.data.data.employees || []);\n";

echo "\n=== 🚀 CHECK COMPLETE ===\n";

?>
