<?php

namespace App\Http\Controllers\WhatsAppWeb;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class WhatsAppWebhookController extends Controller
{
    public function handleNodeHook(Request $request)
    {
        // Security check
        $providedKey = $request->header('x-api-key');
        $expectedKey = env('WHATSAPP_INTERNAL_API_KEY', 'travelops_secret_key_2024');

        if ($providedKey !== $expectedKey) {
            Log::warning('Unauthorized WhatsApp Webhook Attempt:', [
                'ip' => $request->ip(),
                'header' => $providedKey
            ]);
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $payload = $request->all();
        $type = $payload['type'] ?? '';

        Log::info('WhatsApp Webhook Received:', ['type' => $type, 'payload' => $payload]);

        switch ($type) {
            case 'connection_update':
                $this->handleConnectionUpdate($payload);
                break;
            case 'incoming_message':
                $this->handleIncomingMessage($payload);
                break;
            case 'message_receipt':
                $this->handleMessageReceipt($payload);
                break;
            case 'presence_update':
                $this->handlePresenceUpdate($payload);
                break;
            case 'chat_update':
                $this->handleChatUpdate($payload);
                break;
        }

        return response()->json(['status' => 'success']);
    }

    protected function handleConnectionUpdate($data)
    {
        DB::table('whatsapp_sessions')
            ->where('session_name', $data['session_name'])
            ->update([
                'status' => $data['status'],
                'qr_code' => $data['qr'] ?? null,
                'phone_number' => $data['phone_number'] ?? null,
                'updated_at' => now()
            ]);

        // Dispatch real-time event if using Pusher
        $this->dispatchRealTimeEvent('whatsapp.connection', $data);
    }

    protected function handleIncomingMessage($data)
    {
        // 1. Find the session to get user/company
        $session = DB::table('whatsapp_sessions')
            ->where('session_name', $data['session_name'])
            ->first();

        if (!$session)
            return;

        // 2. Extract phone number and find Lead, handling both @s.whatsapp.net and @lid JIDs
        $jid = $data['chat_id'];
        $cleanNumber = explode('@', $jid)[0];
        $jidType = strpos($jid, '@lid') !== false ? 'lid' : 'phone';
        $lead = null;

        if ($jidType === 'phone') {
            // Normal phone JID - extract phone and match lead
            $phoneNumber = preg_replace('/[^0-9]/', '', $cleanNumber);
            $lead = DB::table('leads')
                ->where('company_id', $session->company_id)
                ->whereNull('deleted_at')
                ->where(function ($query) use ($phoneNumber) {
                    $query->where('phone', 'LIKE', '%' . substr($phoneNumber, -10))
                        ->orWhere('phone_secondary', 'LIKE', '%' . substr($phoneNumber, -10));
                })
                ->first();
        } else {
            // @lid JID — Check for existing chat mapping or try to link via replied message
            $existingChat = DB::table('whatsapp_chats')
                ->where('chat_id', $jid)
                ->where('company_id', $session->company_id)
                ->whereNotNull('lead_id')
                ->first();

            if ($existingChat) {
                $lead = DB::table('leads')->where('id', $existingChat->lead_id)->first();
            } else if (!empty($data['quoted_message_id'])) {
                // Try to find the original message this is replying to
                $originalMsg = DB::table('whatsapp_messages')
                    ->where('whatsapp_message_id', $data['quoted_message_id'])
                    ->first();

                if ($originalMsg) {
                    $parentChat = DB::table('whatsapp_chats')->where('id', $originalMsg->whatsapp_chat_id)->first();
                    if ($parentChat && $parentChat->lead_id) {
                        $lead = DB::table('leads')->where('id', $parentChat->lead_id)->first();
                    }
                }
            }
        }

        // 3. Get or create chat (Point 3: Chat List Management)
        $chat = DB::table('whatsapp_chats')
            ->where('chat_id', $jid)
            ->where('company_id', $session->company_id)
            ->first();

        $currentTime = now();
        if (!$chat) {
            $chatId = DB::table('whatsapp_chats')->insertGetId([
                'company_id' => $session->company_id,
                'user_id' => $session->user_id,
                'lead_id' => $lead ? $lead->id : null,
                'chat_id' => $jid,
                'chat_name' => $data['chat_name'] ?? null,
                'unread_count' => 1,
                'last_message_at' => $currentTime,
                'created_at' => $currentTime,
                'updated_at' => $currentTime
            ]);
        } else {
            $chatId = $chat->id;
            DB::table('whatsapp_chats')
                ->where('id', $chatId)
                ->update([
                    'lead_id' => $lead ? $lead->id : $chat->lead_id, // Update if found now
                    'chat_name' => $data['chat_name'] ?? $chat->chat_name,
                    'unread_count' => $chat->unread_count + 1,
                    'last_message_at' => $currentTime,
                    'updated_at' => $currentTime
                ]);
        }

        // 4. Handle Reactions differently — store on original message
        $isReaction = $data['is_reaction'] ?? false;
        $currentTime = now();

        if ($isReaction && !empty($data['body']) && !empty($data['quoted_message_id'])) {
            // Find the original message and add/update the reaction
            $originalMsg = DB::table('whatsapp_messages')
                ->where('whatsapp_message_id', $data['quoted_message_id'])
                ->first();

            if ($originalMsg) {
                $reactions = json_decode($originalMsg->reactions ?? '{}', true) ?: [];
                $senderKey = $data['from'] ?? 'customer';
                $reactions[$senderKey] = $data['body']; // emoji per sender (overwrites previous)

                DB::table('whatsapp_messages')
                    ->where('id', $originalMsg->id)
                    ->update([
                        'reactions' => json_encode($reactions),
                        'updated_at' => $currentTime
                    ]);

                // Real-time update so frontend refreshes the message
                $this->dispatchRealTimeEvent('whatsapp.reaction', [
                    'session_name' => $data['session_name'],
                    'chat_id' => $jid,
                    'message_id' => $data['quoted_message_id'],
                    'emoji' => $data['body'],
                    'from' => $data['from'] ?? 'customer'
                ]);

                return; // Don't insert as a new message
            }
            // If original not found, fall through and save as normal message
        }

        // 5. Save message (normal messages)
        $exists = DB::table('whatsapp_messages')
            ->where('whatsapp_message_id', $data['message_id'])
            ->exists();

        if ($exists) {
            return;
        }

        DB::table('whatsapp_messages')->insert([
            'company_id' => $session->company_id,
            'whatsapp_chat_id' => $chatId,
            'whatsapp_message_id' => $data['message_id'],
            'message' => $data['body'],
            'media_url' => $data['media_url'] ?? null,
            'media_type' => $data['media_type'] ?? null,
            'media_caption' => $data['media_caption'] ?? null,
            'quoted_message_id' => $data['quoted_message_id'] ?? null,
            'quoted_text' => $data['quoted_text'] ?? null,
            'direction' => 'inbound',
            'status' => 'received',
            'created_at' => $currentTime,
            'updated_at' => $currentTime
        ]);

        // 6. Real-time Dispatch
        $this->dispatchRealTimeEvent('whatsapp.message', [
            'session_name' => $data['session_name'],
            'chat_id' => $jid,
            'body' => $data['body'],
            'media_url' => $data['media_url'] ?? null,
            'media_type' => $data['media_type'] ?? null,
            'media_caption' => $data['media_caption'] ?? null,
            'direction' => 'inbound',
            'lead_id' => $lead ? $lead->id : null,
            'sender_name' => $lead ? $lead->client_name : ($data['chat_name'] ?? $cleanNumber)
        ]);
    }

    protected function handleMessageReceipt($data)
    {
        // Point 2: Tracking "Sent", "Delivered", "Read" (Blue Ticks)
        DB::table('whatsapp_messages')
            ->where('whatsapp_message_id', $data['message_id'])
            ->update([
                'status' => $data['status'],
                'updated_at' => now()
            ]);

        $this->dispatchRealTimeEvent('whatsapp.receipt', [
            'session_name' => $data['session_name'],
            'message_id' => $data['message_id'],
            'status' => $data['status']
        ]);
    }

    protected function handlePresenceUpdate($data)
    {
        $this->dispatchRealTimeEvent('whatsapp.presence', [
            'session_name' => $data['session_name'],
            'chat_id' => $data['chat_id'],
            'presence' => $data['presence']
        ]);
    }

    protected function handleChatUpdate($data)
    {
        $session = DB::table('whatsapp_sessions')
            ->where('session_name', $data['session_name'])
            ->first();

        if (!$session || empty($data['chat_id']))
            return;

        DB::table('whatsapp_chats')
            ->where('chat_id', $data['chat_id'])
            ->where('company_id', $session->company_id)
            ->update([
                'chat_name' => $data['chat_name'],
                'updated_at' => now()
            ]);
    }

    protected function dispatchRealTimeEvent($type, $data, $companyId = null)
    {
        if (!$companyId) {
            // Try to find companyId from session if not provided
            $sessionName = $data['session_name'] ?? null;
            if ($sessionName) {
                $session = DB::table('whatsapp_sessions')->where('session_name', $sessionName)->first();
                $companyId = $session ? $session->company_id : null;
            }
        }

        if ($companyId) {
            event(new \App\Events\WhatsAppWebUpdate($type, $data, $companyId));
        }
    }
}
