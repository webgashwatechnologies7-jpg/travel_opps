<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Package;

$all = Package::all();
echo "Total packages: " . $all->count() . "\n";
foreach ($all as $p) {
    echo "ID: {$p->id}, Name: {$p->itinerary_name}, LeadID: " . ($p->lead_id ?? 'NULL') . ", CompanyID: " . ($p->company_id ?? 'NULL') . "\n";
}
