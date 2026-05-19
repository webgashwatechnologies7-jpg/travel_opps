<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$countLeads = DB::table('leads')->count();
$countProposals = DB::table('lead_proposals')->count();
$countQuotations = DB::table('quotations')->count();

echo "Leads: " . $countLeads . "\n";
echo "Proposals: " . $countProposals . "\n";
echo "Quotations: " . $countQuotations . "\n";

$latestLead = DB::table('leads')->orderBy('id', 'desc')->first();
if ($latestLead) {
    echo "Latest Lead ID: " . $latestLead->id . "\n";
}
