<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$c = \App\Models\Company::where('subdomain', 'gashwa')->first();
if ($c) {
    echo "ID: " . $c->id . "\n";
    echo "Subdomain: " . $c->subdomain . "\n";
    echo "Status: " . $c->status . "\n";
} else {
    echo "NOT_FOUND\n";
}
