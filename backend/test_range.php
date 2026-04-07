<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$repo = app(\App\Modules\Leads\Domain\Interfaces\LeadRepositoryInterface::class);

function check($from, $to)
{
    global $repo;
    $filters = ['from_date' => $from, 'to_date' => $to];
    $count = $repo->getPaginated($filters)->total();
    echo "Range [$from to $to] -> Count: $count\n";
}

echo "Lead 3 is 2026-03-03 to 2026-03-06\n";
check('2026-03-03', '2026-03-08');
check('2026-03-03', '2026-03-05');
check('2026-03-04', '2026-03-08');