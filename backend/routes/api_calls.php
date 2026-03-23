<?php

use App\Modules\Calls\Presentation\Controllers\CallController;
use App\Modules\Calls\Presentation\Controllers\CallWebhookController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Call Management Routes
|--------------------------------------------------------------------------
*/

// Webhook routes - public
Route::prefix('calls/webhooks')->group(function () {
    Route::post('/twilio', [CallWebhookController::class, 'twilio']);
    Route::post('/exotel', [CallWebhookController::class, 'exotel']);
});

Route::post('calls/recording', [CallController::class, 'uploadMobileRecording']);

// Call management routes - require authentication
Route::middleware('auth:sanctum')->prefix('calls')->group(function () {
    Route::get('/', [CallController::class, 'index']);
    Route::get('/mappings', [CallController::class, 'listMappings']);
    Route::post('/mappings', [CallController::class, 'storeMapping']);
    Route::put('/mappings/{mappingId}', [CallController::class, 'updateMapping']);
    Route::delete('/mappings/{mappingId}', [CallController::class, 'deleteMapping']);

    Route::post('/sync', [CallController::class, 'syncMobileCalls']);
    Route::delete('/{id}', [CallController::class, 'destroy']);




    Route::get('/{id}', [CallController::class, 'show']);
    Route::get('/{id}/recording', [CallController::class, 'recording']);
    Route::post('/click-to-call', [CallController::class, 'clickToCall']);

    Route::post('/{id}/notes', [CallController::class, 'storeNote']);
    Route::put('/{id}/notes/{noteId}', [CallController::class, 'updateNote']);
});

// Company Telephony setup routes (Used by Admin settings)
Route::middleware(['auth:sanctum', 'role:Admin|Company Admin'])->prefix('company/telephony')->group(function () {
    Route::get('/settings', 'App\Modules\Calls\Presentation\Controllers\CompanyTelephonyController@getSettings');
    Route::put('/settings', 'App\Modules\Calls\Presentation\Controllers\CompanyTelephonyController@updateSettings');
});
