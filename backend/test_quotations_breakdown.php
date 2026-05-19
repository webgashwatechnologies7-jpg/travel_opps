<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$quotations = DB::table('quotations')->orderBy('id', 'desc')->limit(5)->get();
foreach ($quotations as $q) {
    echo "Quotation ID: " . $q->id . "\n";
    echo "Title: " . $q->title . "\n";
    echo "Base Price: " . $q->base_price . "\n";
    echo "Total Price: " . $q->total_price . "\n";
    $pb = json_decode($q->pricing_breakdown, true);
    echo "PB Keys: " . implode(', ', array_keys($pb ?? [])) . "\n";
    if ($pb) {
        foreach ($pb as $k => $v) {
            echo "  Key $k => " . json_encode($v) . "\n";
        }
    }
    $cf = json_decode($q->custom_fields, true);
    echo "CF keys: " . implode(', ', array_keys($cf ?? [])) . "\n";
    echo "CF Display Option: " . ($cf['display_option'] ?? 'None') . "\n";
    echo "----------------------------------------\n";
}
