<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$chats = DB::table('whatsapp_chats')
    ->join('users', 'whatsapp_chats.user_id', '=', 'users.id')
    ->select('users.name', 'whatsapp_chats.user_id', 'whatsapp_chats.company_id', DB::raw('count(*) as chat_count'))
    ->groupBy('users.name', 'whatsapp_chats.user_id', 'whatsapp_chats.company_id')
    ->get();
echo "CHATS PER USER:\n";
echo json_encode($chats, JSON_PRETTY_PRINT) . "\n\n";

$unlinkedGroups = DB::table('whatsapp_chats')
    ->where('chat_id', 'LIKE', '%@g.us')
    ->whereNull('lead_id')
    ->get();
echo "UNLINKED GROUPS (Count: ".count($unlinkedGroups)."):\n";
echo json_encode($unlinkedGroups->take(5), JSON_PRETTY_PRINT) . "\n";
