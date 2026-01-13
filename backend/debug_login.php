<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== Complete Login Debug ===\n";

// Test all users
$users = App\Models\User::all();

foreach ($users as $user) {
    echo "\n--- User ID: {$user->id} ---\n";
    echo "Email: {$user->email}\n";
    echo "Name: {$user->name}\n";
    echo "Is Super Admin: " . ($user->is_super_admin ? 'YES' : 'NO') . "\n";
    echo "Is Active: " . ($user->is_active ? 'YES' : 'NO') . "\n";
    
    // Test with common passwords
    $testPasswords = ['admin123', 'test123', 'password123', 'password'];
    
    foreach ($testPasswords as $pwd) {
        if (Hash::check($pwd, $user->password)) {
            echo "✅ WORKING PASSWORD: {$pwd}\n";
        }
    }
    
    echo "------------------------\n";
}

echo "\n=== Create Fresh Super Admin User ===\n";

// Create a completely new user with simple password
try {
    $newUser = App\Models\User::create([
        'name' => 'Super Admin User',
        'email' => 'superadmin@travelops.com',
        'password' => Hash::make('super123'),
        'is_super_admin' => true,
        'is_active' => true,
        'company_id' => null
    ]);
    
    echo "✅ New user created successfully!\n";
    echo "   Email: superadmin@travelops.com\n";
    echo "   Password: super123\n";
    
    // Test the new user
    $testUser = App\Models\User::where('email', 'superadmin@travelops.com')->first();
    if (Hash::check('super123', $testUser->password)) {
        echo "✅ New user password verification: PASS\n";
    } else {
        echo "❌ New user password verification: FAIL\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error creating user: " . $e->getMessage() . "\n";
}

echo "\n=== Use These Credentials ===\n";
echo "1. superadmin@travelops.com / super123 (NEW - FRESH)\n";
echo "2. test@travelops.com / test123 (Existing)\n";
echo "3. admin2@travelops.com / admin123 (Existing)\n";
