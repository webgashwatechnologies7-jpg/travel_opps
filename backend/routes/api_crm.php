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
    Route::put('/', [ProfileController::class, 'update']);
    Route::put('/password', [ProfileController::class, 'updatePassword']);
});

// Admin routes - require authentication and Admin or Company Admin role
Route::middleware(['auth:sanctum', 'role:Admin|Company Admin'])->prefix('admin')->group(function () {
    // User management routes
    Route::prefix('users')->group(function () {
        Route::post('/', [AdminUserController::class, 'store']);
        Route::get('/', [AdminUserController::class, 'index']);
        Route::get('/{id}', [AdminUserController::class, 'show']);
        Route::put('/{id}', [AdminUserController::class, 'update']);
        Route::delete('/{id}', [AdminUserController::class, 'destroy']);
        Route::put('/{id}/status', [AdminUserController::class, 'updateStatus']);
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
});
