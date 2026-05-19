<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$first = DB::table('query_proposals')->first();
if ($first) {
    echo json_encode($first) . "\n";
} else {
    echo "No query proposals found\n";
}
