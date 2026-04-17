<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$lead = DB::table('leads')
    ->where('phone', 'like', '%9805598988%')
    ->orWhere('phone_secondary', 'like', '%9805598988%')
    ->first();

if ($lead) {
    echo "LEAD FOUND:\n";
    print_r($lead);
} else {
    echo "LEAD NOT FOUND for 9805598988\n";
}
