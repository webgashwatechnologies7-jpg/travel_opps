<?php

use App\Modules\Leads\Presentation\Controllers\FollowupController;
use App\Modules\Leads\Presentation\Controllers\LeadImportController;
use App\Modules\Leads\Presentation\Controllers\LeadsController;
use App\Modules\Calls\Presentation\Controllers\CallController;
use App\Http\Controllers\LeadEmailController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Leads Management Routes
|--------------------------------------------------------------------------
*/

// Leads routes - require authentication
Route::middleware('auth:sanctum')->prefix('leads')->group(function () {
    // Import routes (must come before /{id} routes)
    Route::get('/import-template', [LeadImportController::class, 'downloadTemplate']);
    Route::post('/import', [LeadImportController::class, 'import']);

    Route::get('/', [LeadsController::class, 'index']);
    Route::post('/', [LeadsController::class, 'store']);
    Route::get('/{id}', [LeadsController::class, 'show']);
    Route::get('/{id}/calls', [CallController::class, 'leadHistory']);
    Route::put('/{id}/assign', [LeadsController::class, 'assign']);
    Route::put('/{id}/status', [LeadsController::class, 'updateStatus']);
    Route::put('/{id}', [LeadsController::class, 'update']);
    Route::delete('/{id}', [LeadsController::class, 'destroy']);

    // Lead email routes
    Route::get('/{leadId}/emails', [LeadEmailController::class, 'index']);
    Route::post('/{leadId}/emails', [LeadEmailController::class, 'send']);
    Route::get('/{leadId}/emails/{emailId}', [LeadEmailController::class, 'show']);
});

// Followup routes - require authentication
Route::middleware('auth:sanctum')->prefix('followups')->group(function () {
    Route::get('/today', [FollowupController::class, 'today']);
    Route::get('/overdue', [FollowupController::class, 'overdue']);
    Route::post('/', [FollowupController::class, 'store']);
    Route::put('/{id}/complete', [FollowupController::class, 'complete']);
});
