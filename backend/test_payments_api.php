<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== Testing Payments API ===\n";

// Test 1: Check if Payment model works
echo "1. Testing Payment Model...\n";
try {
    $count = \App\Modules\Payments\Domain\Entities\Payment::count();
    echo "✅ Payment model works. Total payments: $count\n";
} catch (Exception $e) {
    echo "❌ Payment model error: " . $e->getMessage() . "\n";
}

// Test 2: Check due today query
echo "\n2. Testing Due Today Query...\n";
try {
    $today = now()->toDateString();
    echo "Today's date: $today\n";
    
    $payments = \App\Modules\Payments\Domain\Entities\Payment::with(['lead.assignedUser', 'lead.creator', 'creator'])
        ->where('due_date', $today)
        ->where('status', '!=', 'paid')
        ->orderBy('due_date', 'asc')
        ->orderBy('created_at', 'asc')
        ->get();
    
    echo "✅ Due today query works. Found: " . $payments->count() . " payments\n";
    
    foreach ($payments as $payment) {
        echo "  - Payment ID: {$payment->id}, Amount: {$payment->amount}, Status: {$payment->status}\n";
    }
    
} catch (Exception $e) {
    echo "❌ Due today query error: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "\n";
}

// Test 3: Check relationships
echo "\n3. Testing Relationships...\n";
try {
    $payment = \App\Modules\Payments\Domain\Entities\Payment::first();
    if ($payment) {
        echo "✅ First payment found: ID {$payment->id}\n";
        
        // Test lead relationship
        if ($payment->lead) {
            echo "✅ Lead relationship works: {$payment->lead->client_name}\n";
        } else {
            echo "⚠️ Lead relationship is null\n";
        }
        
        // Test creator relationship
        if ($payment->creator) {
            echo "✅ Creator relationship works: {$payment->creator->name}\n";
        } else {
            echo "⚠️ Creator relationship is null\n";
        }
    } else {
        echo "⚠️ No payments found in database\n";
    }
} catch (Exception $e) {
    echo "❌ Relationship test error: " . $e->getMessage() . "\n";
}

echo "\n=== Test Complete ===\n";
echo "If all tests pass, the API should work.\n";
echo "If there are errors, fix them before testing the API endpoint.\n";

?>
