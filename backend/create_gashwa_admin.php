<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== Creating Admin User for Gashwa Technologies ===\n";

// Find Gashwa Technologies company
$company = App\Models\Company::find(3);
if (!$company) {
    echo "Gashwa Technologies company not found!\n";
    exit(1);
}

echo "Found company: {$company->name}\n";

// Create admin user for Gashwa Technologies
try {
    $user = App\Models\User::create([
        'name' => 'Gashwa Admin',
        'email' => 'admin@gashwatechnologies.com',
        'password' => Hash::make('gashwa123'),
        'is_super_admin' => false,
        'is_active' => true,
        'company_id' => $company->id,
    ]);
    
    echo " Company admin user created successfully!\n";
    echo "   Company: {$company->name}\n";
    echo "   Admin Name: {$user->name}\n";
    echo "   Email: {$user->email}\n";
    echo "   Password: gashwa123\n";
    echo "   Login URL: http://localhost:3000/login\n";
    
    echo "\n Email credentials:\n";
    echo "   Email: admin@gashwatechnologies.com\n";
    echo "   Password: gashwa123\n";
    
} catch (Exception $e) {
    echo "❌ Error creating admin user: " . $e->getMessage() . "\n";
}
