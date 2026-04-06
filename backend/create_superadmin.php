<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

try {
    $user = User::updateOrCreate(
        ['email' => 'superadmin@travelopps.com'],
        [
            'name' => 'Super Admin',
            'password' => Hash::make('Super@123'),
            'is_active' => true,
            'is_super_admin' => true,
            'company_id' => null,
            'user_type' => 'super_admin' // in case it is needed
        ]
    );

    // If there's an Admin role, assign it too
    $adminRole = Role::where('name', 'Admin')->first();
    if ($adminRole) {
        $user->assignRole($adminRole);
    }

    echo "✅ Success: Super Admin created with email: superadmin@travelopps.com and password: Super@123\n";
} catch (\Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
