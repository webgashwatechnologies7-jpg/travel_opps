<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\QueryProposal;

$leadId = 55; // From the screenshot #Q-0055
$proposals = QueryProposal::where('lead_id', $leadId)->get();

echo "Proposals for Lead #$leadId:\n";
foreach ($proposals as $p) {
    echo "ID: {$p->id}, Title: {$p->title}, Amount: {$p->total_amount}, Metadata: " . json_encode($p->metadata) . "\n";
}

if ($proposals->isEmpty()) {
    echo "No proposals found in database for Lead #$leadId.\n";
}
