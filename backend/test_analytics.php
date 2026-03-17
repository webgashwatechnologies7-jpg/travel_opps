<?php

use App\Modules\Leads\Infrastructure\Repositories\LeadRepository;
use Illuminate\Http\Request;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$repo = new LeadRepository();
$filters = ['company_id' => 1]; // Assuming company 1

echo "Testing Month Analytics:\n";
$data = $repo->getAnalytics($filters, 'month');
print_r($data);

echo "\nTesting Day Analytics:\n";
$data = $repo->getAnalytics($filters, 'day');
print_r($data);

echo "\nTesting Week Analytics:\n";
$data = $repo->getAnalytics($filters, 'week');
print_r($data);

echo "\nTesting Year Analytics:\n";
$data = $repo->getAnalytics($filters, 'year');
print_r($data);
