<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Package;

$package = Package::orderBy('created_at', 'desc')->first();
if ($package) {
    echo "ID: " . $package->id . "\n";
    echo "Itinerary: " . $package->itinerary_name . "\n";
    echo "Day Events Count: " . (is_array($package->day_events) ? count($package->day_events) : 0) . "\n";
    echo "Days Count: " . (is_array($package->days) ? count($package->days) : 0) . "\n";
    echo "Created At: " . $package->created_at . "\n";
    // echo "JSON: " . json_encode($package->day_events, JSON_PRETTY_PRINT) . "\n";
} else {
    echo "No packages found.\n";
}
