<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$messages = DB::table('whatsapp_messages')
    ->where('direction', 'outbound')
    ->orderBy('id', 'desc')
    ->limit(10)
    ->get();

foreach ($messages as $msg) {
    echo "ID: {$msg->id}, Status: {$msg->status}, Created: {$msg->created_at}\n";
}
