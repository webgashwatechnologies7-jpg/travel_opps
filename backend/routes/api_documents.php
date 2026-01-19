<?php

use App\Http\Controllers\DocumentController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('documents')->group(function () {
    Route::get('/', [DocumentController::class, 'index']);
    Route::post('/', [DocumentController::class, 'store']);
    Route::get('/expired', [DocumentController::class, 'getExpired']);
    Route::get('/expiring-soon', [DocumentController::class, 'getExpiringSoon']);
    Route::get('/{id}', [DocumentController::class, 'show']);
    Route::put('/{id}', [DocumentController::class, 'update']);
    Route::delete('/{id}', [DocumentController::class, 'destroy']);
    Route::post('/{id}/verify', [DocumentController::class, 'verify']);
    Route::post('/{id}/reject', [DocumentController::class, 'reject']);
    Route::get('/{id}/download', [DocumentController::class, 'download']);
});
