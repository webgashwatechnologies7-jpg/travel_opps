<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$lead = DB::table('leads')->where('query_id', 'LIKE', '%0055%')->first();
if ($lead) {
    echo "ID: {$lead->id}, Query ID: {$lead->query_id}\n";
} else {
    echo "Lead #Q-0055 not found in leads table.\n";
}
