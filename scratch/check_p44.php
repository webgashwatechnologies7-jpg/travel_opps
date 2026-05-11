<?php
require __DIR__ . '/../backend/vendor/autoload.php';
$app = require_once __DIR__ . '/../backend/bootstrap/app.php';

use App\Models\LeadProposal;

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$proposal = LeadProposal::find(44);
if ($proposal) {
    echo "ID: " . $proposal->id . "\n";
    echo "itinerary_name: " . $proposal->itinerary_name . "\n";
    echo "day_events type: " . gettype($proposal->day_events) . "\n";
    echo "day_events: " . json_encode($proposal->day_events) . "\n";
    echo "inclusions type: " . gettype($proposal->inclusions) . "\n";
    echo "inclusions: " . json_encode($proposal->inclusions) . "\n";
} else {
    echo "Proposal 44 not found!\n";
}
