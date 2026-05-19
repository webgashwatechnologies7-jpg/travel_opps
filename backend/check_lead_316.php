<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$leadIds = [315, 319, 320, 324];
foreach ($leadIds as $lid) {
    echo "=== Lead ID: $lid ===\n";
    $proposals = DB::table('lead_proposals')->where('lead_id', $lid)->get();
    foreach ($proposals as $p) {
        echo "  Proposal ID: " . $p->id . "\n";
        echo "  Option Number: " . ($p->option_number ?? 'N/A') . "\n";
        echo "  Price: " . $p->price . "\n";
        echo "  Original Package ID: " . ($p->original_package_id ?? 'N/A') . "\n";
        echo "  Confirmed: " . $p->is_confirmed . "\n";
        echo "  Final Client Prices: " . ($p->final_client_prices ?? 'N/A') . "\n";
        echo "  ---------------------------\n";
    }
}
