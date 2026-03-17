<?php

use App\Http\Controllers\ServiceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Services Routes
|--------------------------------------------------------------------------
*/

// Services routes - require authentication
Route::middleware('auth:sanctum')->prefix('services')->group(function () {
    Route::get('/active', [ServiceController::class, 'getActiveServices']);
    Route::apiResource('/', ServiceController::class)->parameters(['' => 'id']);
});
