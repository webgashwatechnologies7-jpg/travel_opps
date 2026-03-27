<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$counts = DB::table('whatsapp_chats')
    ->select('user_id', DB::raw('count(*) as count'))
    ->groupBy('user_id')
    ->get();
echo json_encode($counts, JSON_PRETTY_PRINT);
