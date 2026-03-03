<?php

use App\Modules\WhatsApp\Presentation\Controllers\WhatsAppChatController;
use App\Modules\WhatsApp\Presentation\Controllers\WhatsAppSessionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| WhatsApp Module Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {
    // Session Management
    Route::prefix('whatsapp/session')->group(function () {
        Route::get('/status', [WhatsAppSessionController::class, 'status']);
        Route::post('/connect', [WhatsAppSessionController::class, 'connect']);
        Route::post('/logout', [WhatsAppSessionController::class, 'logout']);
    });

    // Chat Management
    Route::prefix('whatsapp/chats')->group(function () {
        Route::get('/', [WhatsAppChatController::class, 'index']);
        Route::get('/{chatId}/messages', [WhatsAppChatController::class, 'messages']);
        Route::post('/send', [WhatsAppChatController::class, 'sendMessage']);
    });
});
