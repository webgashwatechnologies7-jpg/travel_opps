<?php

use App\Http\Controllers\WhatsAppWeb\WhatsAppSessionController;
use App\Http\Controllers\WhatsAppWeb\WhatsAppChatController;
use App\Http\Controllers\WhatsAppWeb\WhatsAppWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| WhatsApp Web Clone Routes
|--------------------------------------------------------------------------
*/

// Node.js Webhook (Public)
Route::post('whatsapp-web/webhook', [WhatsAppWebhookController::class, 'handleNodeHook']);

// Authenticated Routes
Route::middleware('auth:sanctum')->prefix('whatsapp-web')->group(function () {
    // Session Management
    Route::get('qr', [WhatsAppSessionController::class, 'getQrCode']);
    Route::get('status', [WhatsAppSessionController::class, 'getStatus']);
    Route::post('logout', [WhatsAppSessionController::class, 'logout']);

    // Chat Management
    Route::get('chats', [WhatsAppChatController::class, 'getChatsList']);
    Route::get('chats/{chatId}/messages', [WhatsAppChatController::class, 'getChatMessages']);
    Route::get('messages', [WhatsAppChatController::class, 'getMessagesByChatId']); // accepts ?chat_id=...
    Route::post('messages/send', [WhatsAppChatController::class, 'sendMessage']);
    Route::post('messages/send-media', [WhatsAppChatController::class, 'sendMedia']);
    Route::post('messages/react', [WhatsAppChatController::class, 'sendReaction']);
    Route::post('messages/pin', [WhatsAppChatController::class, 'pinMessage']);
    Route::post('messages/star', [WhatsAppChatController::class, 'starMessage']);
    Route::post('groups/create', [WhatsAppChatController::class, 'createGroup']);
    Route::post('chats/{chatId}/read', [WhatsAppChatController::class, 'markAsRead']);
    Route::get('profile-picture', [WhatsAppChatController::class, 'getProfilePicture']); // ?jid=xxx@s.whatsapp.net
});
