<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$deliveredCount = DB::table('whatsapp_messages')->where('status', 'delivered')->count();
$readCount = DB::table('whatsapp_messages')->where('status', 'read')->count();
$sentCount = DB::table('whatsapp_messages')->where('status', 'sent')->count();

echo "Delivered: $deliveredCount\n";
echo "Read: $readCount\n";
echo "Sent: $sentCount\n";

$latestSent = DB::table('whatsapp_messages')->where('status', 'sent')->orderBy('id', 'desc')->limit(5)->get();
foreach ($latestSent as $msg) {
    echo "ID: {$msg->id}, WA ID: {$msg->whatsapp_message_id}, Status: {$msg->status}, Created At: {$msg->created_at}\n";
}
