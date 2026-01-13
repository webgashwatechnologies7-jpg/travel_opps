<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== All Users in Database ===\n";
$users = App\Models\User::all();

foreach ($users as $user) {
    echo "ID: {$user->id}\n";
    echo "Email: {$user->email}\n";
    echo "Name: {$user->name}\n";
    echo "Super Admin: " . ($user->is_super_admin ? 'YES' : 'NO') . "\n";
    echo "Active: " . ($user->is_active ? 'YES' : 'NO') . "\n";
    echo "Company ID: " . ($user->company_id ?? 'NULL') . "\n";
    echo "------------------------\n";
}

echo "\n=== Login Credentials ===\n";
echo "Try these credentials:\n";
echo "1. admin@travelops.com / password123 (Super Admin)\n";

// Check if admin2@travelops.com exists
$admin2 = App\Models\User::where('email', 'admin2@travelops.com')->first();
if ($admin2) {
    echo "2. admin2@travelops.com / [your password]\n";
} else {
    echo "2. admin2@travelops.com - NOT FOUND in database\n";
    echo "   Creating this user...\n";
    
    try {
        $newUser = App\Models\User::create([
            'name' => 'Admin 2',
            'email' => 'admin2@travelops.com',
            'password' => Hash::make('admin123'),
            'is_super_admin' => false,
            'is_active' => true,
            'company_id' => null
        ]);
        
        echo "   ✅ User created successfully!\n";
        echo "   Use: admin2@travelops.com / admin123\n";
    } catch (Exception $e) {
        echo "   ❌ Error creating user: " . $e->getMessage() . "\n";
    }
}
