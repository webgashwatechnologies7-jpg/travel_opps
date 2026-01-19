<?php

use App\Http\Controllers\AccountsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Accounts Routes
|--------------------------------------------------------------------------
*/

// Account routes - require authentication
Route::middleware('auth:sanctum')->prefix('accounts')->group(function () {
    // Get all account types
    Route::get('/clients', [AccountsController::class, 'clients']);
    Route::get('/agents', [AccountsController::class, 'agents']);
    Route::get('/corporate', [AccountsController::class, 'corporate']);
    
    // Get cities for autocomplete
    Route::get('/cities', [AccountsController::class, 'cities']);
    
    // CRUD operations for clients
    Route::get('/clients/{id}', [AccountsController::class, 'getClient']);
    Route::post('/clients', [AccountsController::class, 'createClient']);
    Route::put('/clients/{id}', [AccountsController::class, 'updateClient']);
    Route::delete('/clients/{id}', [AccountsController::class, 'deleteClient']);
    
    // CRUD operations for agents
    Route::post('/agents', [AccountsController::class, 'createAgent']);
    Route::put('/agents/{id}', [AccountsController::class, 'updateAgent']);
    Route::delete('/agents/{id}', [AccountsController::class, 'deleteAgent']);
    
    // CRUD operations for corporate
    Route::post('/corporate', [AccountsController::class, 'createCorporate']);
    Route::put('/corporate/{id}', [AccountsController::class, 'updateCorporate']);
    Route::delete('/corporate/{id}', [AccountsController::class, 'deleteCorporate']);
});