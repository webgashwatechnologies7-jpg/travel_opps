<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$today = now()->toDateString();
$messages = DB::table('whatsapp_messages')
    ->where('created_at', '>=', $today)
    ->orderBy('id', 'desc')
    ->limit(10)
    ->get();

foreach ($messages as $msg) {
    echo "ID: {$msg->id}, WA ID: {$msg->whatsapp_message_id}, Direction: {$msg->direction}, Status: {$msg->status}, Created At: {$msg->created_at}\n";
}
