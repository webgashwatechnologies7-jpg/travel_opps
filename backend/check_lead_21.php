<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Modules\Leads\Domain\Entities\Lead;
use Carbon\Carbon;

$now = Carbon::now();
echo "Current UTC Time: " . $now->toDateTimeString() . "\n";

$leads = Lead::whereIn('id', [15, 20, 21])->get();

foreach ($leads as $lead) {
    echo "ID: {$lead->id} | Created At: {$lead->created_at} | Client: {$lead->client_name}\n";
}
