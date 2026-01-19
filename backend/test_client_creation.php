<?php

require_once __DIR__ . '/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Test client creation
try {
    $lead = new \App\Modules\Leads\Domain\Entities\Lead();
    $lead->client_name = 'Shubi Paras';
    $lead->client_title = 'Mr.';
    $lead->email = 'web.gashwatechnologies7@gmail.com';
    $lead->phone = '+919805585855';
    $lead->phone_secondary = '+919805598988';
    $lead->source = 'Website'; // Add required field
    $lead->destination = 'Shimla';
    $lead->address = 'Igh';
    $lead->date_of_birth = '2017-06-27';
    $lead->client_type = 'individual';
    $lead->status = 'new';
    $lead->created_by = 1;
    $lead->company_id = 1;
    
    $lead->save();
    
    echo "Client created successfully! ID: " . $lead->id . "\n";
    echo "Name: " . $lead->client_name . "\n";
    echo "Email: " . $lead->email . "\n";
    echo "Phone: " . $lead->phone . "\n";
    echo "City: " . $lead->destination . "\n";
    echo "DOB: " . $lead->date_of_birth . "\n";
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
