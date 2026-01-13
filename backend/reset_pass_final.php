<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'admin2@travelops.com';
$newPassword = 'password';

$user = \App\Models\User::where('email', $email)->first();
if ($user) {
    $user->password = \Illuminate\Support\Facades\Hash::make($newPassword);
    $user->save();
    echo "Password reset to '$newPassword' for $email\n";
} else {
    echo "User not found\n";
}
