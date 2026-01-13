<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Test route
Route::any('/test-unique', function () {
    return response()->json(['status' => 'ok']);
});

// Load modular route files
require __DIR__.'/api_auth.php';
require __DIR__.'/api_crm.php';
require __DIR__.'/api_leads.php';
require __DIR__.'/api_operations.php';
require __DIR__.'/api_settings.php';
require __DIR__.'/api_analytics.php';
require __DIR__.'/api_finance.php';
require __DIR__.'/api_automation.php';
require __DIR__.'/api_superadmin.php';

// Query Detail routes - require authentication
Route::middleware('auth:sanctum')->prefix('queries')->group(function () {
    Route::get('/{id}/detail', [\App\Http\Controllers\QueryDetailController::class, 'show']);
});

// Example protected route (can be removed if not needed)
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
