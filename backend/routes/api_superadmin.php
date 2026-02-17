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
        Route::get('/', [CompanyController::class, 'index']);
        Route::post('/', [CompanyController::class, 'store']);
        Route::get('/stats', [CompanyController::class, 'stats']);
        Route::get('/{id}', [CompanyController::class, 'show']);
        Route::put('/{id}', [CompanyController::class, 'update']);
        Route::delete('/{id}', [CompanyController::class, 'destroy']);
        // DNS Verification Route
        Route::post('/{id}/verify-dns', [CompanyController::class, 'verifyDns']);
    });

    Route::prefix('subscription-plans')->group(function () {
        Route::get('/', [SubscriptionPlanController::class, 'index']);
        Route::post('/', [SubscriptionPlanController::class, 'store']);
        // New Dynamic Features Routes
        Route::get('/available-features', [FeatureController::class, 'index']);

        Route::get('/{id}', [SubscriptionPlanController::class, 'show']);
        Route::put('/{id}', [SubscriptionPlanController::class, 'update']);
        Route::delete('/{id}', [SubscriptionPlanController::class, 'destroy']);

        // Subscription Plan Features
        Route::get('/{id}/features', [FeatureController::class, 'getPlanFeatures']);
        Route::put('/{id}/features', [FeatureController::class, 'updatePlanFeatures']);
    });
});
