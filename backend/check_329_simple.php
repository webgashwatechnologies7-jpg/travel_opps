<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$msg = DB::table('whatsapp_messages')->where('id', 329)->first();
echo "Status: " . $msg->status . "\n";
echo "Delivered At: " . $msg->delivered_at . "\n";
echo "Read At: " . $msg->read_at . "\n";
