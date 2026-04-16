<?php

use App\Modules\Leads\Domain\Entities\Lead;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "Searching for Ashokmule details...\n";

$phone = '8779677671';
$email = 'ashokmule1953@gmail.com';

$lead = Lead::withTrashed()
    ->where(function($q) use ($phone, $email) {
        $q->where('phone', 'like', "%$phone%")
          ->orWhere('email', $email);
    })->first();

if ($lead) {
    echo "FOUND: ID: {$lead->id}, Name: {$lead->client_name}, Deleted: " . ($lead->trashed() ? "YES" : "NO") . "\n";
    echo "Phone in DB: {$lead->phone}, Email in DB: {$lead->email}\n";
} else {
    echo "NOT FOUND IN DATABASE AT ALL.\n";
}
