<?php

namespace App\Http\Controllers\WhatsAppWeb;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppChatController extends Controller
{
    protected $nodeServerUrl;
    protected $apiKey;

    public function __construct()
    {
        $this->nodeServerUrl = env('WHATSAPP_NODE_SERVER_URL', 'http://localhost:3001');
        $this->apiKey = env('WHATSAPP_INTERNAL_API_KEY', 'travelops_secret_key_2024');
    }

    public function getChatsList()
    {
        $user = auth()->user();

        $effectiveCompanyId = $user->company_id ?: config('tenant.id');
        $subordinateIds = $user->getAllSubordinateIds();

        $chats = DB::table('whatsapp_chats')
            ->where('whatsapp_chats.company_id', $effectiveCompanyId)
            ->whereIn('whatsapp_chats.user_id', $subordinateIds)
            ->leftJoin('leads', function ($join) {
                $join->on('whatsapp_chats.lead_id', '=', 'leads.id')
                    ->whereNull('leads.deleted_at');
            })
            ->select(
                'whatsapp_chats.*',
                DB::raw('COALESCE(leads.client_name, whatsapp_chats.chat_name) as chat_name')
            )
            ->orderBy('whatsapp_chats.last_message_at', 'desc')
            ->get();

        $chatIds = $chats->pluck('id')->toArray();
        $lastMsgs = DB::table('whatsapp_messages')
            ->whereIn('whatsapp_chat_id', $chatIds)
            ->whereIn('id', function ($query) use ($chatIds) {
                $query->select(DB::raw('MAX(id)'))
                    ->from('whatsapp_messages')
                    ->whereIn('whatsapp_chat_id', $chatIds)
                    ->groupBy('whatsapp_chat_id');
            })
            ->get()
            ->keyBy('whatsapp_chat_id');

        $uniqueChats = [];
        $seenLeads = [];
        $seenJids = [];

        foreach ($chats as $chat) {
            if ($chat->lead_id) {
                if (in_array($chat->lead_id, $seenLeads))
                    continue;
                $seenLeads[] = $chat->lead_id;
            } else {
                if (in_array($chat->chat_id, $seenJids))
                    continue;
                $seenJids[] = $chat->chat_id;
            }

            $lastMsg = $lastMsgs->get($chat->id);
            $chat->last_message_body = $lastMsg ? $lastMsg->message : null;
            $chat->last_message_status = $lastMsg ? $lastMsg->status : null;

            if (!$chat->chat_name) {
                $phone = explode('@', $chat->chat_id)[0];
                if (strlen($phone) > 10 && str_starts_with($phone, '91')) {
                    $chat->chat_name = '+91 ' . substr($phone, 2);
                } else {
                    $chat->chat_name = $phone;
                }
            }

            $uniqueChats[] = $chat;
        }

        return response()->json([
            'success' => true,
            'data' => $uniqueChats
        ]);
    }

    public function getChatMessages(Request $request)
    {
        $chatId = $request->query('chat_id');
        $limit = $request->query('limit', 50);
        $offset = $request->query('offset', 0);
        $user = auth()->user();
        $effectiveCompanyId = $user->company_id ?: config('tenant.id');

        $chat = DB::table('whatsapp_chats')
            ->where('chat_id', $chatId)
            ->where('company_id', $effectiveCompanyId)
            ->first();

        if (!$chat) {
            return response()->json([
                'success' => true,
                'data' => []
            ]);
        }
        $chatIds = [$chat->id];
        if ($chat->lead_id) {
            $chatIds = DB::table('whatsapp_chats')
                ->where('lead_id', $chat->lead_id)
                ->pluck('id')
                ->toArray();
        }

        $messages = DB::table('whatsapp_messages')
            ->whereIn('whatsapp_chat_id', $chatIds)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc') // Added stable ordering
            ->limit($limit)
            ->offset($offset)
            ->get();

        // Return in ASC order for frontend display
        return response()->json([
            'success' => true,
            'data' => $messages->reverse()->values()
        ]);
    }

    /**
     * Get WhatsApp contact profile picture
     */
    public function getProfilePicture(Request $request)
    {
        $user = auth()->user();
        $jid = $request->query('jid');

        if (!$jid) {
            return response()->json(['success' => false, 'url' => null]);
        }

        $effectiveCompanyId = $user->company_id ?: config('tenant.id');

        try {
            $response = Http::withHeaders(['x-api-key' => $this->apiKey])
                ->get("{$this->nodeServerUrl}/api/profile-picture", [
                    'userId' => $user->id,
                    'companyId' => $effectiveCompanyId,
                    'jid' => $jid
                ]);

            if ($response->successful()) {
                return response()->json($response->json());
            }
        } catch (\Exception $e) {
            // Silently fail
        }

        return response()->json(['success' => true, 'url' => null]);
    }

    /**
     * Get messages by chat_id passed as a query parameter (?chat_id=...)
     * This avoids URL routing issues with @ symbols in path segments.
     * Also merges messages from @lid chats (WhatsApp LID system) linked to the same lead.
     */
    public function getMessagesByChatId(Request $request)
    {
        $user = auth()->user();
        $effectiveCompanyId = $user->company_id ?: config('tenant.id');
        $chatId = $request->query('chat_id');
        $requestLeadId = $request->query('lead_id'); // Frontend can pass lead_id directly
        $limit = $request->query('limit', 100);
        $offset = $request->query('offset', 0);

        if (!$chatId) {
            return response()->json(['success' => false, 'message' => 'chat_id is required'], 400);
        }

        // Extract last 10 digits of phone for fuzzy matching
        $phoneRaw = explode('@', $chatId)[0];
        $last10 = strlen($phoneRaw) >= 10 ? substr($phoneRaw, -10) : $phoneRaw;

        $allChatIds = [];
        $leadId = $requestLeadId ? (int) $requestLeadId : null;

        // Step 0: If lead_id passed from frontend, get ALL chats for that lead immediately
        if ($leadId) {
            $byLead = DB::table('whatsapp_chats')
                ->where('lead_id', $leadId)
                ->where('company_id', $effectiveCompanyId)
                ->pluck('id')->toArray();
            $allChatIds = array_unique(array_merge($allChatIds, $byLead));

            // Also update any chats found by phone to link them to this lead
            if (strlen($last10) >= 10) {
                DB::table('whatsapp_chats')
                    ->where('company_id', $effectiveCompanyId)
                    ->where('chat_id', 'LIKE', '%' . $last10 . '%')
                    ->whereNull('lead_id')
                    ->update(['lead_id' => $leadId]);
            }
        }

        // Step 1: Exact chat_id match
        $primaryChat = DB::table('whatsapp_chats')
            ->where('chat_id', $chatId)
            ->where('company_id', $effectiveCompanyId)
            ->first();

        if ($primaryChat) {
            $allChatIds[] = $primaryChat->id;
            if (!$leadId)
                $leadId = $primaryChat->lead_id;
            // If chat has no lead_id but we got one from request, update it
            if ($requestLeadId && !$primaryChat->lead_id) {
                DB::table('whatsapp_chats')->where('id', $primaryChat->id)->update(['lead_id' => $requestLeadId]);
            }
        }

        // Step 2: All chats linked to same lead
        if ($leadId) {
            $relatedByLead = DB::table('whatsapp_chats')
                ->where('lead_id', $leadId)
                ->where('company_id', $effectiveCompanyId)
                ->pluck('id')->toArray();
            $allChatIds = array_unique(array_merge($allChatIds, $relatedByLead));
        }

        // Step 3: Match by phone number (last 10 digits) in chat_id column
        if (strlen($last10) >= 10) {
            $phoneMatched = DB::table('whatsapp_chats')
                ->where('company_id', $effectiveCompanyId)
                ->where('chat_id', 'LIKE', '%' . $last10 . '%')
                ->pluck('id')->toArray();
            $allChatIds = array_unique(array_merge($allChatIds, $phoneMatched));

            if (!$leadId) {
                $chatWithLead = DB::table('whatsapp_chats')
                    ->where('company_id', $effectiveCompanyId)
                    ->where('chat_id', 'LIKE', '%' . $last10 . '%')
                    ->whereNotNull('lead_id')
                    ->first();
                if ($chatWithLead) {
                    $leadId = $chatWithLead->lead_id;
                    $moreChatIds = DB::table('whatsapp_chats')
                        ->where('lead_id', $leadId)
                        ->where('company_id', $effectiveCompanyId)
                        ->pluck('id')->toArray();
                    $allChatIds = array_unique(array_merge($allChatIds, $moreChatIds));
                }
            }
        }

        // Step 4: Find @lid or unlinked chats by lead client_name (chat_name matching)
        // This catches cases where customer replies from a different JID (@lid) not containing their phone
        if ($leadId) {
            $leadRecord = DB::table('leads')->where('id', $leadId)->first();
            if ($leadRecord && $leadRecord->client_name) {
                // Extract a meaningful word from the name (skip prefixes like Mr, Mrs, etc.)
                $nameParts = preg_split('/\s+/', trim($leadRecord->client_name));
                $searchWord = '';
                foreach ($nameParts as $part) {
                    $part = preg_replace('/[^a-zA-Z]/', '', $part); // remove dots etc
                    if (strlen($part) > 3) {
                        $searchWord = $part;
                        break;
                    }
                }

                if ($searchWord) {
                    // Find unlinked chats whose chat_name matches any word from the lead name
                    $nameMatchedChats = DB::table('whatsapp_chats')
                        ->where('company_id', $effectiveCompanyId)
                        ->where('chat_name', 'LIKE', '%' . $searchWord . '%')
                        ->whereNull('lead_id')
                        ->get();

                    foreach ($nameMatchedChats as $nc) {
                        // Link this orphan chat to the lead permanently
                        DB::table('whatsapp_chats')
                            ->where('id', $nc->id)
                            ->update(['lead_id' => $leadId]);
                        $allChatIds[] = $nc->id;
                    }
                    $allChatIds = array_unique($allChatIds);
                }
            }
        }


        if (empty($allChatIds)) {
            return response()->json([
                'success' => true,
                'data' => [],
                'chat_exists' => false,
                'profile_jid' => $chatId
            ]);
        }

        // Identify best JID for profile picture (Prefer @lid if available)
        $profileJid = $chatId;
        $lidChat = DB::table('whatsapp_chats')
            ->whereIn('id', $allChatIds)
            ->where('chat_id', 'LIKE', '%@lid')
            ->first();
        if ($lidChat) {
            $profileJid = $lidChat->chat_id;
        }

        // Fetch all messages from every matched chat, sorted newest first
        $messages = DB::table('whatsapp_messages')
            ->whereIn('whatsapp_chat_id', $allChatIds)
            ->orderBy('created_at', 'desc')
            ->orderBy('id', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        // Deduplicate and reverse to chronological order
        $uniqueMessages = $messages->unique('whatsapp_message_id')->reverse()->values();

        return response()->json([
            'success' => true,
            'data' => $uniqueMessages,
            'chat_exists' => true,
            'lead_id' => $leadId,
            'profile_jid' => $profileJid
        ]);
    }

    public function sendMessage(Request $request)
    {
        $user = auth()->user();
        $effectiveCompanyId = $user->company_id ?: config('tenant.id');
        $request->validate([
            'chat_id' => 'required|string',
            'message' => 'required|string'
        ]);

        $requestedLeadId = $request->lead_id;

        $chatId = $request->chat_id;
        $messageBody = $request->message;
        $quotedMessageId = $request->quoted_message_id;
        $quotedText = $request->quoted_text;

        // 1. Get or create chat
        $chat = DB::table('whatsapp_chats')
            ->where('chat_id', $chatId)
            ->where('company_id', $user->company_id)
            ->first();

        if (!$chat) {
            // Find lead: first use lead_id from request, else search by phone
            $resolvedLeadId = $requestedLeadId;
            if (!$resolvedLeadId) {
                $phone = explode('@', $chatId)[0];
                if (strlen($phone) > 10 && str_starts_with($phone, '91')) {
                    $phone = substr($phone, 2);
                }
                $lead = DB::table('leads')
                    ->where('company_id', $user->company_id)
                    ->whereNull('deleted_at')
                    ->where(function ($q) use ($phone) {
                        $q->where('phone', 'like', "%{$phone}%")
                            ->orWhere('phone_secondary', 'like', "%{$phone}%");
                    })->first();
                $resolvedLeadId = $lead ? $lead->id : null;
            }

            $chatId_inserted = DB::table('whatsapp_chats')->insertGetId([
                'company_id' => $effectiveCompanyId,
                'user_id' => $user->id,
                'chat_id' => $chatId,
                'lead_id' => $resolvedLeadId,
                'last_message_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
            $whatsapp_chat_id = $chatId_inserted;
        } else {
            // Update lead_id if chat exists but lead_id is null
            if ($requestedLeadId && !$chat->lead_id) {
                DB::table('whatsapp_chats')->where('id', $chat->id)->update(['lead_id' => $requestedLeadId]);
            }
            $whatsapp_chat_id = $chat->id;
        }

        // 2. Save message as Pending
        $messageId = DB::table('whatsapp_messages')->insertGetId([
            'company_id' => $effectiveCompanyId,
            'user_id' => $user->id,
            'whatsapp_chat_id' => $whatsapp_chat_id,
            'whatsapp_message_id' => 'pending_' . uniqid(),
            'quoted_message_id' => $quotedMessageId,
            'quoted_text' => $quotedText,
            'message' => $messageBody,
            'direction' => 'outbound',
            'status' => 'sent',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // 3. Forward to Node.js
        $sendAttempts = 0;
        $response = null;
        $lastException = null;

        while ($sendAttempts < 2) {
            try {
                $response = Http::timeout(25)->withHeaders(['x-api-key' => $this->apiKey])
                    ->post("{$this->nodeServerUrl}/api/message/send", [
                        'userId' => $user->id,
                        'companyId' => $effectiveCompanyId,
                        'to' => $chatId,
                        'message' => $messageBody,
                        'quotedMessageId' => $quotedMessageId,
                        'quotedText' => $quotedText
                    ]);
                $lastException = null;
                break; // Success - exit retry loop
            } catch (\Exception $e) {
                $lastException = $e;
                $sendAttempts++;
                // cURL 56 = Connection reset (Node restarting) - wait 2s and retry once
                if ($sendAttempts < 2 && (str_contains($e->getMessage(), 'cURL error 56') || str_contains($e->getMessage(), 'Connection'))) {
                    Log::warning("WA Gateway connection reset, retrying... attempt {$sendAttempts}");
                    sleep(2);
                } else {
                    break;
                }
            }
        }

        if ($lastException) {
            Log::error("WhatsApp API Connection Error: " . $lastException->getMessage());
            return response()->json(['success' => false, 'message' => 'Gateway connecting, please retry in a moment.'], 503);
        }

        try {
            if ($response->successful()) {
                $nodeData = $response->json();
                DB::table('whatsapp_messages')
                    ->where('id', $messageId)
                    ->update(['whatsapp_message_id' => $nodeData['messageId']]);

                return response()->json([
                    'success' => true,
                    'message_id' => $nodeData['messageId']
                ]);
            }

            $nodeError = $response->json()['error'] ?? 'Unknown Error';
            Log::error("WhatsApp Gateway Failure: {$nodeError} for company {$user->company_id}");

            return response()->json([
                'success' => false,
                'message' => 'Gateway Error: ' . $nodeError
            ], 500);

        } catch (\Exception $e) {
            Log::error("WhatsApp API Connection Error: " . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Gateway Connection Failed: ' . $e->getMessage()], 500);
        }
    }

    public function sendMedia(Request $request)
    {
        $user = auth()->user();
        $effectiveCompanyId = $user->company_id ?: config('tenant.id');
        $request->validate([
            'chat_id' => 'required|string',
            'file' => 'required|file|max:10240', // 10MB limit
            'caption' => 'nullable|string',
            'type' => 'nullable|string|in:image,document,video,audio',
            'quoted_message_id' => 'nullable|string',
            'quoted_text' => 'nullable|string'
        ]);

        $chatId = $request->chat_id;
        $caption = $request->caption;
        $quotedMessageId = $request->quoted_message_id;
        $quotedText = $request->quoted_text;

        // Auto-detect type from MIME if not provided (fallback safety)
        $uploadedFile = $request->file('file');
        $mimeType = $uploadedFile->getMimeType() ?? '';
        $requestedType = $request->type;

        if ($requestedType && in_array($requestedType, ['image', 'document', 'video', 'audio'])) {
            $type = $requestedType;
        } elseif (str_starts_with($mimeType, 'image/')) {
            $type = 'image';
        } elseif (str_starts_with($mimeType, 'video/')) {
            $type = 'video';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            $type = 'audio';
        } else {
            // PDF, Word, Excel, ZIP, etc. → always document
            $type = 'document';
        }

        // 1. Get or create chat
        $chat = DB::table('whatsapp_chats')
            ->where('chat_id', $chatId)
            ->where('company_id', $user->company_id)
            ->first();

        if (!$chat) {
            // Find lead by phone
            $phone = explode('@', $chatId)[0];
            if (strlen($phone) > 10 && str_starts_with($phone, '91')) {
                $phone = substr($phone, 2);
            }
            $lead = DB::table('leads')
                ->where('company_id', $user->company_id)
                ->whereNull('deleted_at')
                ->where(function ($q) use ($phone) {
                    $q->where('phone', 'like', "%{$phone}%")
                        ->orWhere('phone_secondary', 'like', "%{$phone}%");
                })->first();

            $whatsapp_chat_id = DB::table('whatsapp_chats')->insertGetId([
                'company_id' => $effectiveCompanyId,
                'user_id' => $user->id,
                'chat_id' => $chatId,
                'lead_id' => $lead ? $lead->id : null,
                'last_message_at' => now(),
                'created_at' => now(),
                'updated_at' => now()
            ]);
        } else {
            $whatsapp_chat_id = $chat->id;
        }

        // 2. Prepare payload for Node.js
        try {
            $response = Http::withHeaders(['x-api-key' => $this->apiKey])
                ->attach(
                    'file',
                    file_get_contents($request->file('file')),
                    $request->file('file')->getClientOriginalName()
                )->post("{$this->nodeServerUrl}/api/message/send-media", [
                        'userId' => $user->id,
                        'companyId' => $effectiveCompanyId,
                        'to' => $chatId,
                        'caption' => $caption,
                        'type' => $type,
                        'quotedMessageId' => $quotedMessageId,
                        'quotedText' => $quotedText
                    ]);

            if ($response->successful()) {
                $nodeData = $response->json();

                // Save message
                DB::table('whatsapp_messages')->insert([
                    'company_id' => $effectiveCompanyId,
                    'user_id' => $user->id,
                    'whatsapp_chat_id' => $whatsapp_chat_id,
                    'whatsapp_message_id' => $nodeData['messageId'],
                    'quoted_message_id' => $quotedMessageId,
                    'quoted_text' => $quotedText,
                    'message' => $caption ?: "Media: $type",
                    'media_url' => $nodeData['url'],
                    'media_type' => $type,
                    'media_caption' => $caption,
                    'direction' => 'outbound',
                    'status' => 'sent',
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                return response()->json([
                    'success' => true,
                    'message_id' => $nodeData['messageId'],
                    'url' => $nodeData['url']
                ]);
            }

            return response()->json(['success' => false, 'message' => 'Failed to send via gateway'], 500);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function markAsRead($chatId)
    {
        $user = auth()->user();
        $effectiveCompanyId = $user->company_id ?: config('tenant.id');

        // Find the chat to get lead_id
        $chat = DB::table('whatsapp_chats')
            ->where('chat_id', $chatId)
            ->where('company_id', $effectiveCompanyId)
            ->first();

        if ($chat) {
            // 1. Clear unread_count for all chats of this lead
            $chatQuery = DB::table('whatsapp_chats')
                ->where('company_id', $effectiveCompanyId);

            if ($chat->lead_id) {
                $chatQuery->where('lead_id', $chat->lead_id);
            } else {
                $chatQuery->where('id', $chat->id);
            }

            $allRelatedChatIds = $chatQuery->pluck('id');
            $chatQuery->update(['unread_count' => 0]);

            // 2. Mark all inbound messages as 'read' in our database
            DB::table('whatsapp_messages')
                ->whereIn('whatsapp_chat_id', $allRelatedChatIds)
                ->where('direction', 'inbound')
                ->where('status', '!=', 'read')
                ->update(['status' => 'read']);
        }

        return response()->json(['success' => true]);
    }

    public function sendReaction(Request $request)
    {
        $user = auth()->user();
        $request->validate([
            'chat_id' => 'required|string',
            'emoji' => 'required|string',
            'message_id' => 'required|string'
        ]);

        try {
            $response = Http::withHeaders(['x-api-key' => $this->apiKey])
                ->post("{$this->nodeServerUrl}/api/message/react", [
                    'userId' => $user->id,
                    'companyId' => $user->company_id,
                    'to' => $request->chat_id,
                    'emoji' => $request->emoji,
                    'messageId' => $request->message_id
                ]);

            if ($response->successful()) {
                // Update local DB if message exists
                $originalMsg = DB::table('whatsapp_messages')
                    ->where('whatsapp_message_id', $request->message_id)
                    ->first();

                if ($originalMsg) {
                    $reactions = json_decode($originalMsg->reactions ?? '{}', true) ?: [];
                    $reactions['me'] = $request->emoji;

                    DB::table('whatsapp_messages')
                        ->where('id', $originalMsg->id)
                        ->update([
                            'reactions' => json_encode($reactions),
                            'updated_at' => now()
                        ]);
                }

                return response()->json(['success' => true]);
            }

            return response()->json(['success' => false, 'message' => 'Failed to send reaction'], 500);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Pin or unpin a message
     */
    public function pinMessage(Request $request)
    {
        $user = auth()->user();
        $request->validate([
            'chat_id' => 'required|string',
            'message_id' => 'required|string',
            'duration' => 'required|integer', // 86400 (24h), 604800 (7d), 2592000 (30d)
        ]);

        try {
            $response = Http::withHeaders(['x-api-key' => $this->apiKey])
                ->post("{$this->nodeServerUrl}/api/message/pin", [
                    'userId' => $user->id,
                    'companyId' => $user->company_id,
                    'to' => $request->chat_id,
                    'messageId' => $request->message_id,
                    'type' => 'pin',
                    'duration' => $request->duration
                ]);

            if ($response->successful()) {
                // Update chat metadata with pinned message info
                $chat = DB::table('whatsapp_chats')
                    ->where('chat_id', $request->chat_id)
                    ->where('user_id', $user->id)
                    ->first();

                if ($chat) {
                    // Update Pinned Message ID in Chat
                    DB::table('whatsapp_chats')
                        ->where('id', $chat->id)
                        ->update([
                            'pinned_message_id' => $request->message_id,
                            'pinned_at' => now(),
                        ]);

                    // Insert a system message record for history
                    // We need 'from' and 'to' to avoid DB constraints often found in this schema
                    DB::table('whatsapp_messages')->insert([
                        'company_id' => $user->company_id,
                        'user_id' => $user->id,
                        'whatsapp_chat_id' => $chat->id,
                        'whatsapp_message_id' => 'sys_pin_' . now()->timestamp,
                        'direction' => 'outbound',
                        'from' => 'system',
                        'to' => $request->chat_id,
                        'message' => '[REPLY] You pinned a message',
                        'status' => 'read',
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);
                }

                return response()->json(['success' => true]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to pin message: ' . ($response->json()['error'] ?? 'Node Error')
            ], 500);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Pin or unpin a message
     */
    public function starMessage(Request $request)
    {
        $user = auth()->user();
        $request->validate(['message_id' => 'required']);

        try {
            // Find message in DB
            $msg = DB::table('whatsapp_messages')
                ->where('company_id', $user->company_id)
                ->where(function ($q) use ($request) {
                    $q->where('whatsapp_message_id', $request->message_id)
                        ->orWhere('id', $request->message_id);
                })
                ->first();

            if (!$msg) {
                return response()->json(['success' => false, 'message' => 'Message not found'], 404);
            }

            $newStarredStatus = !$msg->is_starred;

            DB::table('whatsapp_messages')
                ->where('id', $msg->id)
                ->update(['is_starred' => $newStarredStatus, 'updated_at' => now()]);

            return response()->json([
                'success' => true,
                'is_starred' => $newStarredStatus,
                'message' => $newStarredStatus ? 'Message starred' : 'Message unstarred'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
    public function createGroup(Request $request)
    {
        $user = auth()->user();
        $request->validate([
            'name' => 'required|string|max:100',
            'participants' => 'required|array|min:1'
        ]);

        try {
            $response = Http::withHeaders(['x-api-key' => $this->apiKey])
                ->post("{$this->nodeServerUrl}/api/group/create", [
                    'userId' => $user->id,
                    'companyId' => $user->company_id,
                    'groupName' => $request->name,
                    'participants' => $request->participants
                ]);

            if ($response->successful()) {
                $nodeData = $response->json();
                $group = $nodeData['group'];

                // Save to local chats
                $chatId = DB::table('whatsapp_chats')->insertGetId([
                    'company_id' => $user->company_id,
                    'user_id' => $user->id,
                    'chat_id' => $group['id'],
                    'chat_name' => $request->name,
                    'last_message_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                return response()->json([
                    'success' => true,
                    'data' => [
                        'id' => $chatId,
                        'chat_id' => $group['id'],
                        'chat_name' => $request->name
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'Node Gateway Error: ' . ($response->json()['error'] ?? 'Unknown error'),
                'node_status' => $response->status(),
                'node_raw' => $response->json()
            ], 500);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
