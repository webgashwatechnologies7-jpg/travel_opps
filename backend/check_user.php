<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
$u = User::where('name', 'like', '%Paras%')->first();
if ($u) {
    echo "Paras Company ID: " . $u->company_id . "\n";
    echo "Paras User ID: " . $u->id . "\n";
} else {
    echo "User not found\n";
}
