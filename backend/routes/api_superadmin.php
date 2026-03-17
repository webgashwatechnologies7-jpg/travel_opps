<?php

use App\Http\Controllers\SuperAdmin\CompanyController;
use App\Http\Controllers\SuperAdmin\MailHealthController;
use App\Http\Controllers\SuperAdmin\SubscriptionPlanController;
use App\Http\Controllers\Api\SuperAdmin\FeatureController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Super Admin Routes
|--------------------------------------------------------------------------
*/

// Super Admin routes - No tenant middleware, accessible from main domain
Route::middleware(['auth:sanctum', 'superadmin'])->prefix('super-admin')->group(function () {
    Route::get('/mail/health', [MailHealthController::class, 'check']);

    Route::prefix('companies')->group(function () {
        Route::get('/stats', [CompanyController::class, 'stats']);
        Route::post('/{id}/verify-dns', [CompanyController::class, 'verifyDns']);
        Route::apiResource('/', CompanyController::class)->parameters(['' => 'id']);
    });

    Route::prefix('subscription-plans')->group(function () {
        Route::get('/available-features', [FeatureController::class, 'index']);
        Route::get('/{id}/features', [FeatureController::class, 'getPlanFeatures']);
        Route::put('/{id}/features', [FeatureController::class, 'updatePlanFeatures']);
        Route::apiResource('/', SubscriptionPlanController::class)->parameters(['' => 'id']);
    });

    // Support Tickets
    Route::prefix('tickets')->group(function () {
        Route::get('/', [\App\Http\Controllers\SuperAdmin\SupportTicketController::class, 'index']);
        Route::get('/{id}', [\App\Http\Controllers\SuperAdmin\SupportTicketController::class, 'show']);
        Route::put('/{id}/status', [\App\Http\Controllers\SuperAdmin\SupportTicketController::class, 'updateStatus']);
        Route::post('/{id}/messages', [\App\Http\Controllers\SuperAdmin\SupportTicketController::class, 'sendMessage']);
    });

    // Global Settings
    Route::prefix('settings')->group(function () {
        Route::get('/', [\App\Http\Controllers\SuperAdmin\SettingController::class, 'index']);
        Route::put('/', [\App\Http\Controllers\SuperAdmin\SettingController::class, 'update']);
        Route::get('/{key}', [\App\Http\Controllers\SuperAdmin\SettingController::class, 'getByKey']);
    });
});
