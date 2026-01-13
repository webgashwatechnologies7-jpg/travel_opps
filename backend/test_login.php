<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== Testing Login Functionality ===\n";

// Test credentials
$email = 'admin2@travelops.com';
$password = 'admin123';

echo "Testing with:\n";
echo "Email: {$email}\n";
echo "Password: {$password}\n\n";

// Find user
$user = App\Models\User::where('email', $email)->first();

if (!$user) {
    echo "❌ User not found!\n";
    exit;
}

echo "✅ User found: {$user->name}\n";

// Test password verification
if (Hash::check($password, $user->password)) {
    echo "✅ Password verification: PASS\n";
    
    // Check if user is active
    if ($user->is_active) {
        echo "✅ User is active: YES\n";
        
        // Check super admin status
        if ($user->is_super_admin) {
            echo "✅ Super Admin: YES\n";
        } else {
            echo "ℹ️  Regular User (Company ID: " . ($user->company_id ?? 'NULL') . ")\n";
        }
        
        echo "\n🎉 LOGIN SHOULD WORK!\n";
        echo "📱 Use these credentials in frontend:\n";
        echo "   Email: {$email}\n";
        echo "   Password: {$password}\n";
        
    } else {
        echo "❌ User is not active!\n";
    }
} else {
    echo "❌ Password verification: FAIL\n";
}
