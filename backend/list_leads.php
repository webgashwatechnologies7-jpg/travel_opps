<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$leads = DB::table('leads')->select('id', 'query_id', 'client_name')->limit(100)->get();
foreach ($leads as $l) {
    if (strpos($l->query_id, '55') !== false) {
        echo "MATCH: ID: {$l->id}, Query ID: {$l->query_id}, Name: {$l->client_name}\n";
    }
}
