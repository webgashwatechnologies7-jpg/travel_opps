<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';

use App\Models\LeadProposal;
use App\Models\Package;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$proposal = LeadProposal::orderBy('id', 'desc')->first();
echo "Latest Proposal ID: " . ($proposal->id ?? 'None') . "\n";
if ($proposal) {
    echo "Itinerary Name: " . $proposal->itinerary_name . "\n";
    echo "Day Events: " . (is_array($proposal->day_events) ? "count: " . count($proposal->day_events) : gettype($proposal->day_events)) . "\n";
    echo "Inclusions: " . (is_array($proposal->inclusions) ? "count: " . count($proposal->inclusions) : gettype($proposal->inclusions)) . "\n";
}

$package = Package::find(114);
if ($package) {
    echo "\nPackage 114:\n";
    echo "Day Events: " . (is_array($package->day_events) ? "count: " . count($package->day_events) : gettype($package->day_events)) . "\n";
}
