<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$sessions = DB::table('whatsapp_sessions')->get();
echo json_encode($sessions, JSON_PRETTY_PRINT);
