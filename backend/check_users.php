<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$users = DB::table('users')->select('id', 'name', 'email', 'company_id', 'reports_to', 'is_super_admin')->get();
echo json_encode($users, JSON_PRETTY_PRINT);
