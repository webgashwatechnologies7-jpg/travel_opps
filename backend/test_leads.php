<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$proposals = DB::table('lead_proposals')->orderBy('id', 'desc')->limit(10)->get();
foreach ($proposals as $p) {
    echo "Proposal ID: " . $p->id . " | Lead ID: " . $p->lead_id . " | Itinerary Name: " . $p->itinerary_name . " | Price: " . $p->price . "\n";
}
