<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$leadId = 316;
echo "=== Lead 316 Proposals ===\n";
$proposals = DB::table('lead_proposals')->where('lead_id', $leadId)->get();
foreach ($proposals as $p) {
    echo "Proposal ID: " . $p->id . "\n";
    echo "Option Number: " . $p->optionNumber . "\n";
    echo "Price: " . $p->price . "\n";
    echo "Itinerary ID: " . $p->itinerary_id . "\n";
    echo "Confirmed: " . $p->confirmed . "\n";
    echo "Pricing Data: " . $p->pricing_data . "\n";
    echo "Final Client Prices: " . $p->final_client_prices . "\n";
    echo "---------------------------\n";
}

echo "\n=== Lead 316 Quotations ===\n";
$quotations = DB::table('quotations')->where('lead_id', $leadId)->orderBy('id', 'desc')->get();
foreach ($quotations as $q) {
    echo "Quotation ID: " . $q->id . "\n";
    echo "Title: " . $q->title . "\n";
    echo "Base Price: " . $q->base_price . "\n";
    echo "Total Price: " . $q->total_price . "\n";
    echo "PB: " . $q->pricing_breakdown . "\n";
    echo "CF: " . $q->custom_fields . "\n";
    echo "---------------------------\n";
}
