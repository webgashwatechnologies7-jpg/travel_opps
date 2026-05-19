<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$leadId = 366;
$proposals = DB::table('lead_proposals')->where('lead_id', $leadId)->get();
foreach ($proposals as $p) {
    echo "Proposal ID: " . $p->id . "\n";
    echo "Itinerary Name: " . $p->itinerary_name . "\n";
    echo "Price: " . $p->price . "\n";
    echo "Is Confirmed: " . $p->is_confirmed . "\n";
    echo "Final Client Prices: " . $p->final_client_prices . "\n";
    echo "Original Package ID: " . $p->original_package_id . "\n";
    echo "----------------------------------------\n";
}

$pricing = DB::table('itinerary_pricings')->where('lead_id', $leadId)->get();
foreach ($pricing as $pr) {
    echo "Pricing ID: " . $pr->id . "\n";
    echo "Package ID: " . $pr->package_id . "\n";
    echo "Final Client Prices (ItineraryPricing): " . $pr->final_client_prices . "\n";
    echo "----------------------------------------\n";
}
