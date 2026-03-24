<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sessions = \Illuminate\Support\Facades\DB::table('whatsapp_sessions')->get();
echo "Total Sessions: " . count($sessions) . "\n";
foreach ($sessions as $s) {
    echo "ID: {$s->id} | User: {$s->user_id} | Company: {$s->company_id} | Status: {$s->status} | QR: " . ($s->qr_code ? 'Present' : 'NULL') . "\n";
}
