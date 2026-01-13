<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== Fixing Password for admin2@travelops.com ===\n";

$user = App\Models\User::where('email', 'admin2@travelops.com')->first();

if (!$user) {
    echo "User not found!\n";
    exit;
}

echo "Current User Info:\n";
echo "ID: {$user->id}\n";
echo "Email: {$user->email}\n";
echo "Name: {$user->name}\n";
echo "Is Super Admin: " . ($user->is_super_admin ? 'YES' : 'NO') . "\n";
echo "Is Active: " . ($user->is_active ? 'YES' : 'NO') . "\n";

// Test current password hash
$newPassword = 'admin123';
$hashedPassword = Hash::make($newPassword);

echo "\n=== Password Hash Test ===\n";
echo "New Password: {$newPassword}\n";
echo "New Hash: {$hashedPassword}\n";

// Test hash verification
$check1 = Hash::check($newPassword, $hashedPassword);
echo "Hash Check (New vs New): " . ($check1 ? 'PASS' : 'FAIL') . "\n";

// Check against current stored hash
$check2 = Hash::check($newPassword, $user->password);
echo "Hash Check (New vs Current): " . ($check2 ? 'PASS' : 'FAIL') . "\n";

// Update password
$user->password = $hashedPassword;
$user->save();

echo "\n=== Password Updated ===\n";
echo "✅ Password successfully updated!\n";
echo "✅ New login credentials:\n";
echo "   Email: admin2@travelops.com\n";
echo "   Password: admin123\n";

// Verify after update
$updatedUser = App\Models\User::where('email', 'admin2@travelops.com')->first();
$check3 = Hash::check($newPassword, $updatedUser->password);
echo "✅ Final Hash Check: " . ($check3 ? 'PASS' : 'FAIL') . "\n";
