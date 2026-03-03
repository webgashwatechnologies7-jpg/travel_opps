<?php

namespace App\Modules\WhatsApp\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\WhatsApp\Domain\Entities\WhatsAppChat;
use App\Modules\WhatsApp\Domain\Entities\WhatsAppMessage;
use App\Traits\StandardApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WhatsAppChatController extends Controller
{
    use StandardApiResponse;

    public function index(Request $request): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id;
            $userId = $request->user()->id;

            $chats = WhatsAppChat::with(['lead:id,client_name,phone', 'user:id,name'])
                ->where('company_id', $companyId)
                // Filter by user if needed, or allow visibility based on permissions
                ->orderBy('updated_at', 'desc')
                ->get();

            return $this->successResponse(['chats' => $chats]);
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to fetch chats', $e);
        }
    }

    public function messages(string $chatId, Request $request): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id;

            $chat = WhatsAppChat::where('company_id', $companyId)
                ->where('chat_id', $chatId)
                ->first();

            if (!$chat) {
                return $this->notFoundResponse('Chat not found');
            }

            $messages = WhatsAppMessage::where('whatsapp_chat_id', $chat->id)
                ->orderBy('created_at', 'asc')
                ->get();

            // Mark as read
            $chat->update(['unread_count' => 0]);

            return $this->successResponse(['chat' => $chat, 'messages' => $messages]);
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to fetch messages', $e);
        }
    }

    public function sendMessage(Request $request): JsonResponse
    {
        // This will be implemented to forward to Node.js server
        return $this->successResponse(null, 'Message sending logic to be implemented');
    }
}
