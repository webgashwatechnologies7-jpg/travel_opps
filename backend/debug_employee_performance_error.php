<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== 🔍 DEBUGGING EMPLOYEE PERFORMANCE API ERROR ===\n\n";

// Test 1: Check API without month parameter
echo "1. ❌ Testing WITHOUT month parameter:\n";
try {
    $user = \App\Models\User::where('email', 'travel@yopmail.com')->first();
    $token = $user->createToken('debug-employee-performance')->plainTextToken;
    
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
    $httpCode = $http_response_header[0] ?? 'Unknown';
    $data = json_decode($response, true);
    
    echo "   Status: $httpCode\n";
    if (isset($data['message'])) {
        echo "   Error: " . $data['message'] . "\n";
    }
    if (isset($data['errors'])) {
        echo "   Validation Errors:\n";
        foreach ($data['errors'] as $field => $errors) {
            echo "     - $field: " . implode(', ', $errors) . "\n";
        }
    }
    
} catch (Exception $e) {
    echo "   Exception: " . $e->getMessage() . "\n";
}

// Test 2: Check API with month parameter
echo "\n2. ✅ Testing WITH month parameter:\n";
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
    
    $response = file_get_contents('http://127.0.0.1:8000/api/dashboard/employee-performance?month=2026-01', false, $context);
    $httpCode = $http_response_header[0] ?? 'Unknown';
    $data = json_decode($response, true);
    
    echo "   Status: $httpCode\n";
    if (isset($data['success']) && $data['success']) {
        echo "   ✅ SUCCESS - Data retrieved\n";
        echo "   Month: " . $data['data']['month'] . "\n";
        echo "   Employees: " . $data['data']['total_employees'] . "\n";
    } else {
        echo "   ❌ FAILED: " . ($data['message'] ?? 'Unknown error') . "\n";
    }
    
} catch (Exception $e) {
    echo "   Exception: " . $e->getMessage() . "\n";
}

// Test 3: Check frontend API call
echo "\n3. 🔧 FRONTEND FIX:\n";
echo "The frontend is calling the API WITHOUT the required 'month' parameter.\n";
echo "\n📝 Solution Options:\n";

echo "\n   Option 1: Fix Frontend API Call\n";
echo "   In frontend/src/services/api.js, line 97:\n";
echo "   Change: employeePerformance: (month) => api.get('/dashboard/employee-performance', { params: { month } })\n";
echo "   This is already correct, but month parameter might be undefined.\n";

echo "\n   Option 2: Make month parameter optional in backend\n";
echo "   In PerformanceController.php, modify validation:\n";
echo "   'month' => 'nullable|regex:/^\d{4}-\d{2$/',\n";
echo "   And add default: \$month = \$request->input('month', date('Y-m'));\n";

echo "\n   Option 3: Add default month in frontend\n";
echo "   In EmployeePerformance.jsx, ensure month is passed:\n";
echo "   const currentMonth = new Date().toISOString().slice(0, 7); // 2026-01\n";
echo "   employeePerformance(currentMonth)\n";

echo "\n4. 🎯 QUICK FIX FOR FRONTEND:\n";
echo "Add this to your browser console to fix the immediate issue:\n";

echo "\n// Fix frontend API call\n";
echo "const originalEmployeePerformance = window.dashboardAPI?.employeePerformance;\n";
echo "if (window.dashboardAPI) {\n";
echo "  window.dashboardAPI.employeePerformance = function(month) {\n";
echo "    const defaultMonth = new Date().toISOString().slice(0, 7); // 2026-01\n";
echo "    return this.get('/dashboard/employee-performance', { params: { month: month || defaultMonth } });\n";
echo "  };\n";
echo "  console.log('✅ Employee Performance API fixed with default month');\n";
echo "}\n";

echo "\n=== 🚀 DEBUG COMPLETE ===\n";

?>
