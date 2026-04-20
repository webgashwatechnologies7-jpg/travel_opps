<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$messages = DB::table('whatsapp_messages')->orderBy('id', 'desc')->limit(50)->get();
$output = "";
foreach ($messages as $msg) {
    $output .= "ID: {$msg->id} | WA_ID: " . str_pad($msg->whatsapp_message_id, 32) . " | Dir: " . str_pad($msg->direction, 8) . " | Status: " . str_pad($msg->status, 10) . " | Body: {$msg->message}\n";
}
file_put_contents('db_dump.txt', $output);
echo "Dumped to db_dump.txt\n";


