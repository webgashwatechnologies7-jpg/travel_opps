<?php

use App\Http\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Notifications Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
    Route::post('/tokens', [NotificationController::class, 'storeToken']);
    Route::delete('/tokens', [NotificationController::class, 'deleteToken']);
    Route::post('/push', [NotificationController::class, 'sendPush']);
    Route::post('/email', [NotificationController::class, 'sendEmail']);
});
