<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$proposals = DB::table('query_proposals')->get();
echo "Total Proposals in DB: " . $proposals->count() . "\n";
foreach ($proposals as $p) {
    echo "Lead ID: {$p->lead_id}, Title: {$p->title}\n";
}
