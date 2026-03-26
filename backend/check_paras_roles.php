<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
$u = User::where('name', 'like', '%Paras%')->first();
if ($u) {
    echo "Paras Name: " . $u->name . "\n";
    echo "Paras Roles: " . $u->roles->pluck('name')->implode(', ') . "\n";
} else {
    echo "User not found\n";
}
