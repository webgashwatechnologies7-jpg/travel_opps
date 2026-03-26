<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Modules\Leads\Domain\Entities\Lead;

$lead = Lead::where('id', '55')->orWhere('query_id', 'like', '%55%')->get();
foreach ($lead as $l) {
    echo "ID: {$l->id}, Query ID: {$l->query_id}, Name: {$l->client_name}\n";
}
