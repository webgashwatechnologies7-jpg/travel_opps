<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\DB;

$chats = DB::table('whatsapp_chats')->get();
echo "CHATS:\n";
foreach ($chats as $chat) {
    echo "ID: {$chat->id}, JID: {$chat->chat_id}, Name: {$chat->chat_name}, Lead ID: {$chat->lead_id}, Last Msg At: {$chat->last_message_at}\n";
}

echo "\nMESSAGES:\n";
$messages = DB::table('whatsapp_messages')->orderBy('id', 'desc')->limit(10)->get();
foreach ($messages as $msg) {
    echo "ID: {$msg->id}, Chat ID: {$msg->whatsapp_chat_id}, Body: " . substr($msg->message, 0, 50) . "..., Created At: {$msg->created_at}\n";
}
