<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Modules\Leads\Domain\Entities\Lead;
use Carbon\Carbon;

$today = Carbon::now();
echo "Current Server Time (UTC): " . $today->toDateTimeString() . "\n";
echo "Current Local Time (suggested): 2026-03-26 09:21:05 +05:30\n";

$leads = Lead::orderBy('created_at', 'desc')->take(5)->get();

foreach ($leads as $lead) {
    echo "ID: {$lead->id}, Created At (UTC): {$lead->created_at}, Client: {$lead->client_name}\n";
}
