<?php

use App\Modules\Automation\Presentation\Controllers\CampaignController;
use App\Modules\Automation\Presentation\Controllers\GoogleSheetSyncController;
use App\Modules\Automation\Presentation\Controllers\InboxController;
use App\Modules\Automation\Presentation\Controllers\WhatsappController;
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

// WhatsApp routes - require authentication
Route::middleware('auth:sanctum')->prefix('whatsapp')->group(function () {
    Route::get('/inbox', [InboxController::class, 'inbox']);
    Route::post('/send', [WhatsappController::class, 'send']);
});

// Campaign routes - require authentication
Route::middleware('auth:sanctum')->prefix('campaigns')->group(function () {
    Route::post('/', [CampaignController::class, 'store']);
    Route::get('/', [CampaignController::class, 'index']);
    Route::post('/{id}/run', [CampaignController::class, 'run']);
});
