<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$leads = DB::table('leads')->whereIn('client_name', ['ram', 'paras'])->get();
echo "LEADS:\n";
foreach ($leads as $lead) {
    echo "ID: {$lead->id}, Name: {$lead->client_name}, Phone: {$lead->phone}\n";
}
