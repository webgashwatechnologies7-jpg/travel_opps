<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$lead = App\Modules\Leads\Domain\Entities\Lead::first();
if ($lead) {
    echo "Lead Date: " . $lead->created_at->toDateTimeString() . "\n";
    echo "Current System Time: " . now()->toDateTimeString() . "\n";
} else {
    echo "No leads found.\n";
}
