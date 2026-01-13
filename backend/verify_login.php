<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'admin2@travelops.com';
$password = 'password';

$user = \App\Models\User::where('email', $email)->first();

echo "User: " . ($user ? $user->email : 'NOT FOUND') . "\n";
echo "DB Password Hash: " . ($user ? $user->password : 'N/A') . "\n";

$check = \Illuminate\Support\Facades\Hash::check($password, $user->password);

echo "Hash Check Result: " . ($check ? 'MATCH' : 'FAIL') . "\n";
echo "Config Driver: " . config('hashing.driver') . "\n";
