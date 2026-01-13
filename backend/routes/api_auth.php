<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ForgotPasswordController;
use App\Http\Controllers\GoogleMailController;
use App\Http\Controllers\GoogleController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

// Public authentication routes
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/password/email', [ForgotPasswordController::class, 'sendResetLinkEmail']);
    Route::post('/password/reset', [ForgotPasswordController::class, 'reset']);

    // Protected authentication routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/profile', [AuthController::class, 'profile']);
    });
});

// Google OAuth routes
Route::prefix('google')->group(function () {
    Route::get('/connect', [GoogleMailController::class, 'redirect']);
    Route::get('/callback', [GoogleMailController::class, 'callback']);
});

// Gmail API routes - require authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/send-gmail', [GoogleMailController::class, 'sendGmail']);
    Route::get('/sync-inbox', [GoogleMailController::class, 'syncInbox']);
    Route::get('/leads/{leadId}/gmail-emails', [GoogleMailController::class, 'getEmails']);
});
