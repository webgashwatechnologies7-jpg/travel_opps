<?php

use Illuminate\Support\Facades\DB;

// 1. Identify all chats for the same lead that are split
$duplicates = DB::table('whatsapp_chats')
    ->select('lead_id', 'user_id', DB::raw('COUNT(*) as chat_count'))
    ->whereNotNull('lead_id')
    ->groupBy('lead_id', 'user_id')
    ->having('chat_count', '>', 1)
    ->get();

foreach ($duplicates as $dup) {
    $chats = DB::table('whatsapp_chats')
        ->where('lead_id', $dup->lead_id)
        ->where('user_id', $dup->user_id)
        ->orderByRaw("chat_id LIKE '%@s.whatsapp.net' DESC") // Try to keep JID as primary if it exists, otherwise longest LID
        ->orderBy('created_at', 'asc')
        ->get();

    $primary = $chats[0];
    $others = $chats->slice(1);

    foreach ($others as $other) {
        echo "Merging Chat {$other->id} ({$other->chat_id}) into Chat {$primary->id} ({$primary->chat_id}) for Lead {$dup->lead_id}\n";
        
        // Move messages
        DB::table('whatsapp_messages')
            ->where('whatsapp_chat_id', $other->id)
            ->update(['whatsapp_chat_id' => $primary->id]);
            
        // Delete the duplicate chat
        DB::table('whatsapp_chats')->where('id', $other->id)->delete();
    }
}

// 2. Fix the specific Paras/Shivani split issue (Shared Phone)
// If we have multiple leads for the same phone, and messages are scattered
$leadsWithSharedPhone = DB::table('leads')
    ->select('phone', DB::raw('COUNT(*) as lead_count'))
    ->whereNotNull('phone')
    ->groupBy('phone')
    ->having('lead_count', '>', 1)
    ->get();

foreach ($leadsWithSharedPhone as $item) {
    $leadIds = DB::table('leads')->where('phone', $item->phone)->pluck('id')->toArray();
    echo "Found shared phone {$item->phone} for leads: " . implode(',', $leadIds) . "\n";
    
    // Find all chats involving these leads
    $chats = DB::table('whatsapp_chats')->whereIn('lead_id', $leadIds)->get();
    
    if ($chats->count() > 1) {
        // Merge them into the MOST RECENT chat record (likely the active one)
        $primaryChat = $chats->sortByDesc('last_message_at')->first();
        
        foreach ($chats as $chat) {
            if ($chat->id === $primaryChat->id) continue;
            
            echo "Relinking messages from Chat {$chat->id} to Primary Chat {$primaryChat->id}\n";
            DB::table('whatsapp_messages')
                ->where('whatsapp_chat_id', $chat->id)
                ->update(['whatsapp_chat_id' => $primaryChat->id]);
                
            // Instead of deleting (might be risky if they are separate people), 
            // we just empty the unread and let it stay, or just merge messages.
            // Actually, for this specific Paras/Shivani case, merging is best.
        }
    }
}

echo "Done cleanup.\n";
