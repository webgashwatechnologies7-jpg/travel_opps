<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Package;

$shimla = Package::where('itinerary_name', 'LIKE', '%shimla%')->first();
$kangra = Package::where('itinerary_name', 'LIKE', '%kangra%')->first();

if ($shimla) {
    echo "Shimla Template (#{$shimla->id}) Price: {$shimla->price}\n";
} else {
    echo "Shimla Template not found\n";
}

if ($kangra) {
    echo "Kangra Template (#{$kangra->id}) Price: {$kangra->price}\n";
} else {
    echo "Kangra Template not found\n";
}
