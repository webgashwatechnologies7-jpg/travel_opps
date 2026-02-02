<?php

use App\Modules\Automation\Presentation\Controllers\CampaignController;
use App\Modules\Automation\Presentation\Controllers\GoogleSheetSyncController;
use App\Modules\Automation\Presentation\Controllers\InboxController;
use App\Modules\Automation\Presentation\Controllers\WhatsappController;
use App\Http\Controllers\WhatsAppController as PublicWhatsAppController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Automation Routes
|--------------------------------------------------------------------------
*/

// Google Sheets sync routes - require authentication
Route::middleware('auth:sanctum')->prefix('google-sheets')->group(function () {
    Route::post('/connect', [GoogleSheetSyncController::class, 'connect']);
    Route::get('/status', [GoogleSheetSyncController::class, 'status']);
});

// WhatsApp webhook routes - public (Meta will call these)
Route::prefix('webhooks/whatsapp')->group(function () {
    Route::post('/{company_id}', [PublicWhatsAppController::class, 'webhook'])
        ->middleware('tenant.param');
});

// WhatsApp routes - require authentication
Route::middleware('auth:sanctum')->prefix('whatsapp')->group(function () {
    Route::get('/inbox', [InboxController::class, 'inbox']);
    Route::get('/inbox-by-user/{userId}', [InboxController::class, 'inboxByUser']);
    Route::get('/messages/{leadId}', [InboxController::class, 'messagesByLead']);
    Route::post('/send', [WhatsappController::class, 'send']);
    Route::post('/send-media', [WhatsappController::class, 'sendMedia']);
});

// Campaign routes - require authentication
Route::middleware('auth:sanctum')->prefix('campaigns')->group(function () {
    Route::post('/', [CampaignController::class, 'store']);
    Route::get('/', [CampaignController::class, 'index']);
    Route::post('/{id}/run', [CampaignController::class, 'run']);
});
