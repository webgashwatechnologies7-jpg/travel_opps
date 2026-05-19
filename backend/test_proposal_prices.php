<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$proposals = DB::table('lead_proposals')->orderBy('id', 'desc')->get();
foreach ($proposals as $p) {
    echo "Proposal ID: " . $p->id . "\n";
    echo "Lead ID: " . $p->lead_id . "\n";
    echo "Itinerary Name: " . $p->itinerary_name . "\n";
    echo "Price: " . $p->price . "\n";
    echo "Final Client Prices: " . $p->final_client_prices . "\n";
    echo "Option GST Settings: " . $p->option_gst_settings . "\n";
    echo "Pricing Data: " . substr($p->pricing_data, 0, 100) . "...\n";
    echo "----------------------------------------\n";
}
