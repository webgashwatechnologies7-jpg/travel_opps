<?php

use App\Modules\Crm\Presentation\Controllers\AdminUserController;
use App\Modules\Crm\Presentation\Controllers\CompanySettingsController;
use App\Modules\Crm\Presentation\Controllers\PermissionController;
use App\Modules\Crm\Presentation\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| CRM Routes
|--------------------------------------------------------------------------
*/

// Profile routes - require authentication and active user
Route::middleware(['auth:sanctum', 'active'])->prefix('profile')->group(function () {
    Route::get('/', [ProfileController::class, 'show']);
    Route::post('/', [ProfileController::class, 'update']);
    Route::put('/password', [ProfileController::class, 'updatePassword']);
});

// Admin routes - require authentication and Admin, Company Admin, Manager or Team Leader role
Route::middleware(['auth:sanctum', 'role:Admin|Company Admin|Manager|Team Leader'])->prefix('admin')->group(function () {
    // User management routes
    Route::prefix('users')->group(function () {
        Route::put('/{id}/status', [AdminUserController::class, 'updateStatus']);
        Route::apiResource('/', AdminUserController::class)->parameters(['' => 'id']);
    });

    // Permission management routes
    Route::prefix('permissions')->group(function () {
        Route::get('/roles', [PermissionController::class, 'getRoles']);
        Route::get('/list', [PermissionController::class, 'getPermissions']);
        Route::get('/roles/{roleName}', [PermissionController::class, 'getRolePermissions']);
        Route::put('/roles/{roleName}', [PermissionController::class, 'updateRolePermissions']);
    });

    // Company settings routes
    Route::prefix('settings')->group(function () {
        Route::get('/', [CompanySettingsController::class, 'show']);
        Route::put('/', [CompanySettingsController::class, 'update']);
        Route::post('/reset', [CompanySettingsController::class, 'reset']);
    });

    // Support Tickets
    Route::prefix('support')->group(function () {
        Route::post('/tickets/{id}/messages', [\App\Http\Controllers\SupportController::class, 'sendMessage']);
        Route::apiResource('/tickets', \App\Http\Controllers\SupportController::class)->parameters(['' => 'id'])->except(['update', 'destroy']);
    });
});
