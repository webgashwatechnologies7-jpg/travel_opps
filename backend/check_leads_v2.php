<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Modules\Leads\Domain\Entities\Lead;
use Carbon\Carbon;

$now = Carbon::now();
echo "--- Time Info ---\n";
echo "Server UTC Time: " . $now->toDateTimeString() . "\n";
echo "Server System Time (local to machine): " . date('Y-m-d H:i:s') . "\n";
echo "App Config Timezone: " . config('app.timezone') . "\n";
echo "Carbon Now with toDateString: " . $now->toDateString() . "\n";

echo "\n--- Recent Leads (Top 10) ---\n";
$leads = Lead::orderBy('created_at', 'desc')->take(10)->get();

foreach ($leads as $lead) {
    echo "ID: {$lead->id} | Created At: {$lead->created_at} | Updated At: {$lead->updated_at} | Client: {$lead->client_name} | Query: #Q-{$lead->id}\n";
}
