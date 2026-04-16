<?php

use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Automation\Domain\Entities\GoogleSheetConnection;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Debugging Ashokmule import error...\n";

$row = [
    'form name' => 'Spiti Valley Tour Packages',
    'is organic' => 'false',
    'platform' => 'fb',
    'full name' => 'Ashokmule',
    'phone number' => 'p:+918779677671',
    'email' => 'ashokmule1953@gmail.com',
    'city' => 'Kalyan',
    'state' => 'maharastra'
];

$config = GoogleSheetConnection::where('company_id', 20)->first();
if (!$config) {
    die("Config not found for company 20\n");
}

// Simple mapping logic mimic
$mapping = $config->mapping;
$leadData = [
    'company_id' => 20,
    'client_name' => $row['full name'],
    'phone' => '8779677671',
    'email' => $row['email'],
    'source' => 'Google Sheets',
    'status' => 'new',
    'city' => $row['city'] ?? null,
    'state' => $row['state'] ?? null,
];

try {
    echo "Attempting to create lead for Ashokmule...\n";
    $lead = Lead::create($leadData);
    echo "SUCCESS! Lead ID: {$lead->id}\n";
} catch (\Exception $e) {
    file_put_contents('debug_error.txt', $e->getMessage());
    echo "CRITICAL ERROR SAVED TO debug_error.txt\n";
}
