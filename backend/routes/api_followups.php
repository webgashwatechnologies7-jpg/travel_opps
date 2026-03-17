<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\FollowUpController;

// Follow-up API Routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Get follow-ups for a specific client
    Route::get('/clients/{clientId}/follow-ups', [FollowUpController::class, 'getClientFollowUps'])
        ->name('followups.client.index');
    
    Route::apiResource('/follow-ups', FollowUpController::class)->only(['store', 'update', 'destroy']);
});

// Public routes for testing (remove in production)
Route::get('/clients/{clientId}/follow-ups', [FollowUpController::class, 'getClientFollowUps']);
Route::post('/follow-ups', [FollowUpController::class, 'store']);
