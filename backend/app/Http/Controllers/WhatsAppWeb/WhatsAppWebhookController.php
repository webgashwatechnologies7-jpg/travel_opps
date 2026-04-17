<?php

namespace App\Http\Controllers\WhatsAppWeb;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Notifications\GenericNotification;


class WhatsAppWebhookController extends Controller
{
    public function handleNodeHook(Request $request)
    {
        Log::info('WhatsApp Webhook Received:', $request->all());
        
        // Security check
        $providedKey = $request->header('x-api-key');
        $expectedKey = env('WHATSAPP_INTERNAL_API_KEY', 'travelops_secure_gateway_key_99');

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
        $session = DB::table('whatsapp_sessions')
            ->where('session_name', $data['session_name'])
            ->first();

        // Security Check: Ensure the connected WhatsApp number matches the Employee's CRM number
        if ($session && $data['status'] === 'Connected' && !empty($data['phone_number'])) {
            $user = DB::table('users')->where('id', $session->user_id)->first();
            if ($user && !empty($user->phone)) {
                $userPhone = preg_replace('/[^0-9]/', '', $user->phone);
                $whatsappPhone = preg_replace('/[^0-9]/', '', $data['phone_number']);
                
                // Compare last 10 digits to allow for country code variations
                if (substr($userPhone, -10) !== substr($whatsappPhone, -10)) {
                    Log::warning("WhatsApp Phone Mismatch for User {$user->id}: CRM expects ...".substr($userPhone, -4).", Scanned ...".substr($whatsappPhone, -4));
                    
                    // Kill the session immediately
                    $this->forceLogout($session->user_id, $session->company_id);
                    
                    DB::table('whatsapp_sessions')
                        ->where('session_name', $data['session_name'])
                        ->update([
                            'status' => 'Unauthorized_Phone',
                            'qr_code' => null,
                            'phone_number' => $data['phone_number'],
                            'updated_at' => now()
                        ]);
                        
                    $data['status'] = 'Unauthorized_Phone';
                    $this->dispatchRealTimeEvent('whatsapp.connection', $data);
                    return;
                }
            }
        }

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

    protected function forceLogout($userId, $companyId)
    {
        try {
            \Illuminate\Support\Facades\Http::withHeaders([
                'x-api-key' => env('WHATSAPP_INTERNAL_API_KEY', 'travelops_secure_gateway_key_99')
            ])->post(env('WHATSAPP_NODE_SERVER_URL', 'http://localhost:3001') . "/api/session/logout", [
                'userId' => $userId,
                'companyId' => $companyId
            ]);
        } catch (\Exception $e) {
            Log::error("Failed to force logout WhatsApp session: " . $e->getMessage());
        }
    }

    protected function handleIncomingMessage($data)
    {
        // Skip technical protocol messages
        $bodyText = $data['body'] ?? '';
        if (strpos($bodyText, '[protocol message]') !== false || 
            strpos($bodyText, '[messageContextInfo message]') !== false || 
            strpos($bodyText, '[senderKeyDistributionMessage]') !== false) {
            return;
        }

        // 1. Find the session to get user/company
        $session = DB::table('whatsapp_sessions')
            ->where('session_name', $data['session_name'])
            ->first();

        if (!$session)
            return;

        $jid = $data['chat_id'];
        $rawPhone = explode('@', $jid)[0];
        // Normalize: remove non-digits and strip leading 91 if present
        $cleanPhone = preg_replace('/\D/', '', $rawPhone);
        if (strlen($cleanPhone) > 10 && str_starts_with($cleanPhone, '91')) {
            $cleanPhone = substr($cleanPhone, 2);
        }
        $phone = $cleanPhone;
        
        Log::info("Processing WhatsApp message from normalized phone: $phone");$jidType = strpos($jid, '@lid') !== false ? 'lid' : (strpos($jid, '@g.us') !== false ? 'group' : 'phone');
        $lead = null;

        if ($jidType === 'phone') {
            $phoneNumber = preg_replace('/[^0-9]/', '', $phone);
            $lead = DB::table('leads')
                ->where('company_id', $session->company_id)
                ->whereNull('deleted_at')
                ->where(function ($query) use ($phoneNumber) {
                    $query->where('phone', 'LIKE', '%' . substr($phoneNumber, -10))
                        ->orWhere('phone_secondary', 'LIKE', '%' . substr($phoneNumber, -10));
                })
                ->first();
        } else if ($jidType === 'lid') {
            // @lid JID — Try to link via remote_jid_alt (Linked Phone) if available
            $remoteJidAlt = $data['remote_jid_alt'] ?? null;
            if ($remoteJidAlt) {
                $altNumber = preg_replace('/[^0-9]/', '', explode('@', $remoteJidAlt)[0]);
                $lead = DB::table('leads')
                    ->where('company_id', $session->company_id)
                    ->whereNull('deleted_at')
                    ->where(function ($query) use ($altNumber) {
                        $query->where('phone', 'LIKE', '%' . substr($altNumber, -10))
                            ->orWhere('phone_secondary', 'LIKE', '%' . substr($altNumber, -10));
                    })
                    ->first();
            }

            if (!$lead) {
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

            // Name Matching Fix for @lid (If not linked yet)
            if ($jidType === 'lid' && !$lead && !empty($data['chat_name'])) {
                // Try matching Lead Name exactly
                $lead = DB::table('leads')
                    ->where('company_id', $session->company_id)
                    ->whereNull('deleted_at')
                    ->where('client_name', trim($data['chat_name']))
                    ->orderBy('created_at', 'desc')
                    ->first();

                // If lead still null, try finding another chat that has the same chat_name and is linked to a lead
                if (!$lead) {
                    $otherChat = DB::table('whatsapp_chats')
                        ->where('company_id', $session->company_id)
                        ->where('chat_name', trim($data['chat_name']))
                        ->whereNotNull('lead_id')
                        ->first();
                    if ($otherChat) {
                        $lead = DB::table('leads')->where('id', $otherChat->lead_id)->first();
                    }
                }
            }
        }
        
        if (!$lead) {
            // Check if this chat was already manually linked to a lead or created from the CRM
            $existingLinkedChat = DB::table('whatsapp_chats')
                ->where('chat_id', $jid)
                ->where('company_id', $session->company_id)
                ->exists();

            if (!$existingLinkedChat && $jidType === 'phone') {
                // Silently allow it if it's a direct phone JID, a new lead might be created later or it's a reply
                Log::info("Processing non-lead message as it's a valid phone JID: $jid");
            } elseif (!$existingLinkedChat) {
                 return response()->json(['status' => 'ignored', 'message' => 'Not a lead number and not a linked chat']);
            }
        }

        // 3. Get or create chat - prioritize using existing chat for this lead
        $chat = null;
        if ($lead) {
            $chat = DB::table('whatsapp_chats')
                ->where('lead_id', $lead->id)
                ->where('company_id', $session->company_id)
                ->where('user_id', $session->user_id)
                ->orderByRaw("chat_id LIKE '%@s.whatsapp.net' DESC") // Prefer phone-based JID
                ->first();
        }

        if (!$chat) {
            $chat = DB::table('whatsapp_chats')
                ->where('chat_id', $jid)
                ->where('company_id', $session->company_id)
                ->where('user_id', $session->user_id)
                ->first();
        }

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

        $direction = isset($data['direction']) ? $data['direction'] : 'inbound';
        Log::info("Saving message with direction: $direction", ['msg_id' => $data['message_id']]);

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
            'direction' => $direction,
            'status' => 'received',
            'created_at' => $currentTime,
            'updated_at' => $currentTime
        ]);

        // 6. Real-time Dispatch
        $this->dispatchRealTimeEvent('whatsapp.message', [
            'id' => $data['message_id'], // Map to ID for frontend consistency
            'whatsapp_message_id' => $data['message_id'],
            'session_name' => $data['session_name'],
            'chat_id' => $jid,
            'message' => $data['body'], // Consistent with message model
            'body' => $data['body'],
            'media_url' => $data['media_url'] ?? null,
            'media_type' => $data['media_type'] ?? null,
            'media_caption' => $data['media_caption'] ?? null,
            'quoted_message_id' => $data['quoted_message_id'] ?? null,
            'quoted_text' => $data['quoted_text'] ?? null,
            'direction' => $direction,
            'lead_id' => $lead ? $lead->id : null,
            'sender_name' => $lead ? $lead->client_name : ($data['chat_name'] ?? $phone),
            'created_at' => now()->toISOString()
        ]);

        // 7. Bell Icon Notification for Inbound
        if ($direction === 'inbound') {
            try {
                $recipient = User::find($session->user_id);
                if ($recipient) {
                    $senderName = $lead ? $lead->client_name : ($data['chat_name'] ?? $phone);
                    $recipient->notify(new GenericNotification([
                        'type' => 'whatsapp',
                        'title' => 'New WhatsApp Message',
                        'message' => 'New message from ' . $senderName . ': ' . substr($data['body'], 0, 50) . (strlen($data['body']) > 50 ? '...' : ''),
                        'action_url' => $lead ? '/leads/' . $lead->id : '/whatsapp-web',
                    ]));
                }
            } catch (\Exception $e) {
                Log::error('WhatsApp Notification Error: ' . $e->getMessage());
            }
        }
    }

    protected function handleMessageReceipt($data)
    {
        // Point 2: Tracking "Sent", "Delivered", "Read" (Blue Ticks)
        $status = $data['status'];
        $updateData = [
            'status' => $status,
            'updated_at' => now()
        ];

        if ($status === 'delivered') {
            $updateData['delivered_at'] = now();
        } elseif ($status === 'read') {
            $updateData['read_at'] = now();
        }

        DB::table('whatsapp_messages')
            ->where('whatsapp_message_id', $data['message_id'])
            ->update($updateData);

        $msg = DB::table('whatsapp_messages')
            ->where('whatsapp_message_id', $data['message_id'])
            ->first();

        $this->dispatchRealTimeEvent('whatsapp.receipt', [
            'session_name' => $data['session_name'],
            'message_id' => $data['message_id'],
            'status' => $status,
            'delivered_at' => $msg->delivered_at ?? null,
            'read_at' => $msg->read_at ?? null
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
            ->where('user_id', $session->user_id)
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
