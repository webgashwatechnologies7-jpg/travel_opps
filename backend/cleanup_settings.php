<?php

use App\Models\Setting;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$keys = ['company_logo', 'company_favicon'];

foreach ($keys as $key) {
    $setting = Setting::where('key', $key)->first();
    if ($setting && $setting->value) {
        echo "Processing $key: {$setting->value}\n";

        // If it contains "storage/", extract what's after it
        if (strpos($setting->value, 'storage/') !== false) {
            $parts = explode('storage/', $setting->value);
            $newValue = end($parts);

            // Clean up any double slashes or leading slashes
            $newValue = ltrim($newValue, '/');

            $setting->value = $newValue;
            $setting->save();
            echo "Updated $key to: $newValue\n";
        }
    }
}

echo "Cleanup complete.\n";
