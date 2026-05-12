<?php

use App\Models\Package;
use Illuminate\Support\Facades\DB;

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$duplicates = Package::select('itinerary_name', DB::raw('count(*) as count'))
    ->whereNull('lead_id') // Only look at templates
    ->groupBy('itinerary_name')
    ->having('count', '>', 1)
    ->pluck('itinerary_name');

echo "Found " . count($duplicates) . " template names with duplicates.\n\n";

foreach ($duplicates as $name) {
    echo "Processing: $name\n";
    
    // Get all copies, ordered by updated_at desc (keep the newest)
    $items = Package::where('itinerary_name', $name)
        ->whereNull('lead_id')
        ->withCount('proposals')
        ->orderBy('updated_at', 'desc')
        ->get();
        
    $toKeep = $items->first();
    $toDelete = $items->slice(1);
    
    echo "  [KEEP] ID: {$toKeep->id} (Updated: {$toKeep->updated_at}, Used in {$toKeep->proposals_count} leads)\n";
    
    foreach ($toDelete as $item) {
        $status = $item->proposals_count > 0 ? "STAY (Used in {$item->proposals_count} leads)" : "DELETE";
        echo "  [$status] ID: {$item->id} (Updated: {$item->updated_at})\n";
        
        if ($status === "DELETE") {
            // $item->delete(); // Uncomment to actually delete
        }
    }
    echo "\n";
}
