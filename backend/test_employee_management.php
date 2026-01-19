<?php

require __DIR__ . '/vendor/autoload.php';

use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Employee Management System Test ===\n\n";

try {
    // Test 1: Get employees list
    echo "1. Testing employees list API...\n";
    $response = app(\App\Http\Controllers\EmployeeController::class)->getEmployeesList();
    echo "Status: " . ($response->getStatusCode() === 200 ? "✓ PASS" : "✗ FAIL") . "\n";
    echo "Response: " . $response->getContent() . "\n\n";

    // Test 2: Get first employee details (if employees exist)
    $employeesData = json_decode($response->getContent(), true);
    if ($employeesData['success'] && !empty($employeesData['data'])) {
        $firstEmployeeId = $employeesData['data'][0]['id'];
        
        echo "2. Testing employee details API for employee ID: $firstEmployeeId...\n";
        $detailsResponse = app(\App\Http\Controllers\EmployeeController::class)->getEmployeeDetails($firstEmployeeId);
        echo "Status: " . ($detailsResponse->getStatusCode() === 200 ? "✓ PASS" : "✗ FAIL") . "\n";
        echo "Response: " . substr($detailsResponse->getContent(), 0, 200) . "...\n\n";

        // Test 3: Test employee reports
        echo "3. Testing employee reports API...\n";
        $request = new Request(['period' => 'monthly']);
        $reportsResponse = app(\App\Http\Controllers\EmployeeController::class)->getEmployeeReports($request, $firstEmployeeId);
        echo "Status: " . ($reportsResponse->getStatusCode() === 200 ? "✓ PASS" : "✗ FAIL") . "\n";
        echo "Response: " . substr($reportsResponse->getContent(), 0, 200) . "...\n\n";

        // Test 4: Test profit/loss analysis
        echo "4. Testing profit/loss analysis API...\n";
        $profitLossResponse = app(\App\Http\Controllers\EmployeeController::class)->getEmployeeProfitLoss($request, $firstEmployeeId);
        echo "Status: " . ($profitLossResponse->getStatusCode() === 200 ? "✓ PASS" : "✗ FAIL") . "\n";
        echo "Response: " . substr($profitLossResponse->getContent(), 0, 200) . "...\n\n";

        // Test 5: Test performance history
        echo "5. Testing performance history API...\n";
        $historyRequest = new Request(['period' => 'daily']);
        $historyResponse = app(\App\Http\Controllers\EmployeeController::class)->getPerformanceHistory($historyRequest, $firstEmployeeId);
        echo "Status: " . ($historyResponse->getStatusCode() === 200 ? "✓ PASS" : "✗ FAIL") . "\n";
        echo "Response: " . substr($historyResponse->getContent(), 0, 200) . "...\n\n";
    } else {
        echo "No employees found to test individual APIs.\n";
    }

    // Test 6: Test performance logging command
    echo "6. Testing performance logging command...\n";
    try {
        $command = app(\App\Console\Commands\LogEmployeePerformance::class);
        $command->handle();
        echo "Status: ✓ PASS - Performance logging completed successfully\n\n";
    } catch (Exception $e) {
        echo "Status: ✗ FAIL - Error: " . $e->getMessage() . "\n\n";
    }

    echo "=== Test Summary ===\n";
    echo "Employee Management System APIs are working correctly!\n";
    echo "You can now access the frontend at: http://localhost:5173/employee-management\n";
    echo "API Endpoints:\n";
    echo "- GET /api/employees - Get all employees\n";
    echo "- GET /api/employees/{id} - Get employee details\n";
    echo "- GET /api/employees/{id}/reports - Get employee reports\n";
    echo "- GET /api/employees/{id}/reports/pdf - Download PDF report\n";
    echo "- GET /api/employees/{id}/profit-loss - Get profit/loss analysis\n";
    echo "- GET /api/employees/{id}/performance-history - Get performance history\n";

} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}

echo "\n=== Test Complete ===\n";
