<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Company;

$companies = Company::all();
foreach ($companies as $c) {
    echo "ID: {$c->id}, Subdomain: {$c->subdomain}, Domain: {$c->domain}\n";
}
