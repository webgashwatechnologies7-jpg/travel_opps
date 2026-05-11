<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$package = \App\Models\Package::find(29);
$data = $package->toArray();
unset($data['id'], $data['created_at'], $data['updated_at']);
$data['lead_id'] = 253;
$data['original_package_id'] = 29;
$data['created_by'] = 39;
$data['company_id'] = 20;
try {
    \App\Models\LeadProposal::create($data);
    echo "SUCCESS\n";
} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
