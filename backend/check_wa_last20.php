<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$messages = DB::table('whatsapp_messages')
    ->orderBy('id', 'desc')
    ->limit(20)
    ->get(['id', 'direction', 'status', 'created_at']);

foreach ($messages as $msg) {
    echo "ID: {$msg->id}, Dir: {$msg->direction}, Status: {$msg->status}, Created: {$msg->created_at}\n";
}
