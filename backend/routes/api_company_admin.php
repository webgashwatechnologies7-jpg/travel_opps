<?php

use App\Http\Controllers\CompanyAdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Company Admin Routes
|--------------------------------------------------------------------------
*/

// Company Admin Management - Super Admin only
Route::middleware(['auth:sanctum', 'role:Super Admin'])->prefix('company-admin')->group(function () {
    Route::post('/create', [CompanyAdminController::class, 'createCompanyAdmin']);
    Route::get('/list', [CompanyAdminController::class, 'getCompanyAdmins']);
    Route::put('/{userId}/permissions', [CompanyAdminController::class, 'updateCompanyAdminPermissions']);
});

// Subscription Plans - Super Admin only
Route::middleware(['auth:sanctum', 'role:Super Admin'])->prefix('subscription-plans')->group(function () {
    Route::get('/', [CompanyAdminController::class, 'getSubscriptionPlans']);
});

// Company Admin Profile - Company Admin only
Route::middleware(['auth:sanctum', 'role:Company Admin'])->prefix('company-admin')->group(function () {
    Route::get('/profile', [CompanyAdminController::class, 'getCompanyAdminProfile']);
    Route::put('/profile', [CompanyAdminController::class, 'updateCompanyAdminProfile']);
});
