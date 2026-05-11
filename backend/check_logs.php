<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\QueryHistoryLog;

$leadId = 255;
$logs = QueryHistoryLog::where('lead_id', $leadId)
    ->orderBy('created_at', 'desc')
    ->limit(10)
    ->get();

echo "Latest Logs for Lead #$leadId:\n";
foreach ($logs as $log) {
    echo "ID: {$log->id} | Type: {$log->activity_type} | Desc: {$log->activity_description} | At: {$log->created_at}\n";
    echo "Old: " . json_encode($log->old_values) . "\n";
    echo "New: " . json_encode($log->new_values) . "\n";
    echo "------------------------------------------\n";
}
