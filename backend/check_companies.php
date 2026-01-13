<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== Checking Companies ===\n";

$companies = App\Models\Company::all();

if ($companies->count() === 0) {
    echo "❌ No companies found in database!\n";
    echo "🔧 Creating a default company...\n";
    
    try {
        $company = App\Models\Company::create([
            'name' => 'Default Travel Company',
            'subdomain' => 'default',
            'email' => 'company@travelops.com',
            'phone' => '+1234567890',
            'address' => '123 Main Street',
            'city' => 'Travel City',
            'country' => 'Country',
            'is_active' => true,
        ]);
        
        echo "✅ Company created successfully!\n";
        echo "   ID: {$company->id}\n";
        echo "   Name: {$company->name}\n";
        echo "   Subdomain: {$company->subdomain}\n";
        
        // Create admin user for this company
        $user = App\Models\User::create([
            'name' => 'Company Admin',
            'email' => 'admin@travelops.com',
            'password' => Hash::make('admin123'),
            'is_super_admin' => false,
            'is_active' => true,
            'company_id' => $company->id,
        ]);
        
        echo "✅ Company admin user created!\n";
        echo "   Email: admin@travelops.com\n";
        echo "   Password: admin123\n";
        
    } catch (Exception $e) {
        echo "❌ Error creating company: " . $e->getMessage() . "\n";
    }
} else {
    echo "✅ Found {$companies->count()} companies:\n";
    foreach ($companies as $company) {
        echo "ID: {$company->id} | Name: {$company->name} | Subdomain: {$company->subdomain} | Active: " . ($company->is_active ? 'YES' : 'NO') . "\n";
    }
}

echo "\n=== Checking for subdomain '127' ===\n";
$company127 = App\Models\Company::where('subdomain', '127')->first();
if ($company127) {
    echo "✅ Company with subdomain '127' found:\n";
    echo "   Name: {$company127->name}\n";
    echo "   Active: " . ($company127->is_active ? 'YES' : 'NO') . "\n";
} else {
    echo "❌ No company found with subdomain '127'\n";
    echo "🔧 Creating company with subdomain '127'...\n";
    
    try {
        $company = App\Models\Company::create([
            'name' => 'Main Travel Company',
            'subdomain' => '127',
            'email' => 'main@travelops.com',
            'phone' => '+1234567890',
            'address' => '456 Main Street',
            'city' => 'Main City',
            'country' => 'Main Country',
            'is_active' => true,
        ]);
        
        echo "✅ Company created successfully!\n";
        echo "   ID: {$company->id}\n";
        echo "   Name: {$company->name}\n";
        echo "   Subdomain: {$company->subdomain}\n";
        
    } catch (Exception $e) {
        echo "❌ Error creating company: " . $e->getMessage() . "\n";
    }
}
