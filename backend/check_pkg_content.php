<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Package;

$packages = Package::whereNotNull('day_events')->orWhereNotNull('days')->get();
echo "Total packages with synced content: " . $packages->count() . "\n";
foreach ($packages as $p) {
    echo "ID: {$p->id}, Name: {$p->itinerary_name}\n";
}
