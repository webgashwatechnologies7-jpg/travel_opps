<?php

use App\Http\Controllers\CurrencyController;
use App\Http\Controllers\ExpenseTypeController;
use App\Http\Controllers\LeadSourceController;
use App\Http\Controllers\PackageThemeController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SupplierController;
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
