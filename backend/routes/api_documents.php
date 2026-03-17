<?php

use App\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('documents')->group(function () {
    Route::get('/expired', [DocumentController::class, 'getExpired']);
    Route::get('/expiring-soon', [DocumentController::class, 'getExpiringSoon']);
    Route::post('/{id}/verify', [DocumentController::class, 'verify']);
    Route::post('/{id}/reject', [DocumentController::class, 'reject']);
    Route::get('/{id}/download', [DocumentController::class, 'download']);
    Route::apiResource('/', DocumentController::class)->parameters(['' => 'id']);
});
