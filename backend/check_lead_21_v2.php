<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Modules\Leads\Domain\Entities\Lead;
$l = Lead::find(21);
echo "Lead 21 Company ID: " . $l->company_id . "\n";
echo "Lead 21 Created At: " . $l->created_at . "\n";
echo "Lead 21 Deleted At: " . ($l->deleted_at ?? 'null') . "\n";
