<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Modules\Calls\Domain\Entities\CallLog;

$calls = CallLog::orderByDesc('call_started_at')->take(20)->get();
foreach ($calls as $c) {
    echo sprintf("ID: %d, UserID: %d, From: %s, To: %s, Time: %s, FromNorm: %s, ToNorm: %s\n",
        $c->id, $c->user_id, $c->from_number, $c->to_number, $c->call_started_at,
        $c->from_number_normalized, $c->to_number_normalized);
}
