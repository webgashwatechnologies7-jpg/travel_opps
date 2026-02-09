<?php

use App\Http\Controllers\CompanySettingsController;
use App\Http\Controllers\MenuController;
use App\Http\Controllers\ContentController;
use App\Http\Controllers\CompanyMailSettingsController;
use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\ExpenseTypeController;
use App\Http\Controllers\LeadSourceController;
use App\Http\Controllers\PackageThemeController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SupplierController;
use App\Http\Controllers\SupplierFinancialController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Settings & Configuration Routes
|--------------------------------------------------------------------------
*/

// Suppliers routes - require authentication
Route::middleware('auth:sanctum')->prefix('suppliers')->group(function () {
    Route::get('/', [SupplierController::class, 'index']);
    Route::post('/', [SupplierController::class, 'store']);
    Route::post('/send-email', [SupplierController::class, 'sendEmail']);
    // Part 2 - Supplier financial summary
    Route::get('/{supplierId}/financial-summary', [SupplierFinancialController::class, 'getSupplierFinancialSummary']);
    Route::post('/{supplierId}/lead-costs', [SupplierFinancialController::class, 'storeLeadSupplierCost']);
    Route::get('/{supplierId}/lead-costs', [SupplierFinancialController::class, 'getSupplierLeadCosts']);
    Route::post('/{supplierId}/financial-transactions', [SupplierFinancialController::class, 'storeSupplierFinancialTransaction']);
    Route::get('/{supplierId}/financial-transactions', [SupplierFinancialController::class, 'getSupplierFinancialTransactions']);
    Route::post('/{supplierId}/financial-transactions/{transactionId}/payment', [SupplierFinancialController::class, 'recordSupplierTransactionPayment']);
    Route::get('/{id}', [SupplierController::class, 'show']);
    Route::put('/{id}', [SupplierController::class, 'update']);
    Route::delete('/{id}', [SupplierController::class, 'destroy']);
});

// Settings routes - require authentication
Route::middleware('auth:sanctum')->prefix('settings')->group(function () {
    Route::get('/', [SettingsController::class, 'index']);
    Route::post('/', [SettingsController::class, 'store']);
    Route::get('/max-hotel-options', [SettingsController::class, 'getMaxHotelOptions']);
    Route::post('/upload-logo', [SettingsController::class, 'uploadLogo']);
});

// Sidebar menu - dynamic (from settings or default)
Route::middleware('auth:sanctum')->prefix('menu')->group(function () {
    Route::get('/', [MenuController::class, 'index']);
    Route::put('/', [MenuController::class, 'update']);
});

// Content / labels - dynamic (for Phase 1 & 2)
Route::middleware('auth:sanctum')->prefix('content')->group(function () {
    Route::get('/', [ContentController::class, 'index']);
    Route::put('/', [ContentController::class, 'update']);
});

// Lead Sources routes - require authentication
Route::middleware('auth:sanctum')->prefix('lead-sources')->group(function () {
    Route::get('/', [LeadSourceController::class, 'index']);
    Route::post('/', [LeadSourceController::class, 'store']);
    Route::get('/{id}', [LeadSourceController::class, 'show']);
    Route::put('/{id}', [LeadSourceController::class, 'update']);
    Route::delete('/{id}', [LeadSourceController::class, 'destroy']);
});

// Expense Types routes - require authentication
Route::middleware('auth:sanctum')->prefix('expense-types')->group(function () {
    Route::get('/', [ExpenseTypeController::class, 'index']);
    Route::post('/', [ExpenseTypeController::class, 'store']);
    Route::get('/{id}', [ExpenseTypeController::class, 'show']);
    Route::put('/{id}', [ExpenseTypeController::class, 'update']);
    Route::delete('/{id}', [ExpenseTypeController::class, 'destroy']);
});

// Package Themes routes - require authentication
Route::middleware('auth:sanctum')->prefix('package-themes')->group(function () {
    Route::get('/', [PackageThemeController::class, 'index']);
    Route::post('/', [PackageThemeController::class, 'store']);
    Route::get('/{id}', [PackageThemeController::class, 'show']);
    Route::put('/{id}', [PackageThemeController::class, 'update']);
    Route::delete('/{id}', [PackageThemeController::class, 'destroy']);
});

// Currencies routes - require authentication
Route::middleware('auth:sanctum')->prefix('currencies')->group(function () {
    Route::get('/', [CurrencyController::class, 'index']);
    Route::post('/', [CurrencyController::class, 'store']);
    Route::get('/{id}', [CurrencyController::class, 'show']);
    Route::put('/{id}', [CurrencyController::class, 'update']);
    Route::delete('/{id}', [CurrencyController::class, 'destroy']);
});

// Company Settings routes - require authentication
Route::middleware('auth:sanctum')->prefix('company-settings')->group(function () {
    // Users management
    Route::get('/users', [CompanySettingsController::class, 'getUsers']);
    Route::get('/users/{id}', [CompanySettingsController::class, 'getUserDetails']);
    Route::get('/users/{id}/performance', [CompanySettingsController::class, 'getUserPerformance']);
    Route::get('/team-reports', [CompanySettingsController::class, 'getTeamReport']);
    Route::post('/users', [CompanySettingsController::class, 'createUser']);
    Route::put('/users/{id}', [CompanySettingsController::class, 'updateUser']);
    Route::delete('/users/{id}', [CompanySettingsController::class, 'deleteUser']);
    
    // Branches management
    Route::get('/branches', [CompanySettingsController::class, 'getBranches']);
    Route::post('/branches', [CompanySettingsController::class, 'createBranch']);
    Route::put('/branches/{id}', [CompanySettingsController::class, 'updateBranch']);
    Route::delete('/branches/{id}', [CompanySettingsController::class, 'deleteBranch']);
    
    // Roles management
    Route::get('/roles', [CompanySettingsController::class, 'getRoles']);
    Route::post('/roles', [CompanySettingsController::class, 'createRole']);
    Route::put('/roles/{id}', [CompanySettingsController::class, 'updateRole']);
    Route::delete('/roles/{id}', [CompanySettingsController::class, 'deleteRole']);

    // Permissions management
    Route::get('/permissions', [CompanySettingsController::class, 'getPermissions']);
    Route::get('/roles/{id}/permissions', [CompanySettingsController::class, 'getRolePermissions']);
    Route::put('/roles/{id}/permissions', [CompanySettingsController::class, 'updateRolePermissions']);
    Route::get('/users/{id}/permissions', [CompanySettingsController::class, 'getUserPermissions']);
    Route::put('/users/{id}/permissions', [CompanySettingsController::class, 'updateUserPermissions']);
    
    // Statistics
    Route::get('/stats', [CompanySettingsController::class, 'getStats']);

    // Company Mail Settings
    Route::get('/mail-settings', [CompanyMailSettingsController::class, 'show']);
    Route::put('/mail-settings', [CompanyMailSettingsController::class, 'update']);
    Route::post('/mail-settings/test', [CompanyMailSettingsController::class, 'test']);
});

// Company WhatsApp settings - require authentication
Route::middleware('auth:sanctum')->prefix('company/whatsapp')->group(function () {
    Route::get('/settings', [\App\Http\Controllers\CompanyWhatsAppController::class, 'getSettings']);
    Route::put('/settings', [\App\Http\Controllers\CompanyWhatsAppController::class, 'updateSettings']);
    Route::post('/auto-provision', [\App\Http\Controllers\CompanyWhatsAppController::class, 'autoProvision']);
    Route::post('/sync', [\App\Http\Controllers\CompanyWhatsAppController::class, 'syncSettings']);
    Route::post('/test-connection', [\App\Http\Controllers\CompanyWhatsAppController::class, 'testConnection']);
});

// Company Google (Gmail) settings - require authentication
Route::middleware('auth:sanctum')->prefix('company/google')->group(function () {
    Route::get('/settings', [\App\Http\Controllers\CompanyGoogleController::class, 'getSettings']);
    Route::put('/settings', [\App\Http\Controllers\CompanyGoogleController::class, 'updateSettings']);
});
