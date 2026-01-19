<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FollowUpController;

// Follow-up API Routes
Route::middleware(['auth:sanctum'])->group(function () {
    
    // Get follow-ups for a specific client
    Route::get('/clients/{clientId}/follow-ups', [FollowUpController::class, 'getClientFollowUps'])
        ->name('followups.client.index');
    
    // Store new follow-up
    Route::post('/follow-ups', [FollowUpController::class, 'store'])
        ->name('followups.store');
    
    // Update follow-up
    Route::put('/follow-ups/{id}', [FollowUpController::class, 'update'])
        ->name('followups.update');
    
    // Delete follow-up
    Route::delete('/follow-ups/{id}', [FollowUpController::class, 'destroy'])
        ->name('followups.destroy');
        
});

// Public routes for testing (remove in production)
Route::get('/clients/{clientId}/follow-ups', [FollowUpController::class, 'getClientFollowUps']);
Route::post('/follow-ups', [FollowUpController::class, 'store']);
