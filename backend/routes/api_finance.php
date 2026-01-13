<?php

use App\Modules\Finance\Presentation\Controllers\ExpenseController;
use App\Modules\Hr\Presentation\Controllers\TargetController;
use App\Modules\Leads\Presentation\Controllers\PaymentController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Finance & HR Routes
|--------------------------------------------------------------------------
*/

// Payment routes - require authentication
Route::middleware('auth:sanctum')->prefix('payments')->group(function () {
    Route::get('/due-today', [PaymentController::class, 'dueToday']);
    Route::get('/pending', [PaymentController::class, 'pending']);
    Route::get('/lead/{leadId}', [PaymentController::class, 'getByLead']);
    Route::post('/', [PaymentController::class, 'store']);
});

// Expense routes - require authentication
Route::middleware('auth:sanctum')->prefix('expenses')->group(function () {
    Route::post('/', [ExpenseController::class, 'store']);
    Route::get('/', [ExpenseController::class, 'index']);
    Route::get('/monthly-summary', [ExpenseController::class, 'monthlySummary']);
    Route::delete('/{id}', [ExpenseController::class, 'destroy']);
});

// Target routes - require authentication and Admin role
Route::middleware(['auth:sanctum', 'role:Admin'])->prefix('targets')->group(function () {
    Route::get('/{user_id}/{month}', [TargetController::class, 'show']);
    Route::post('/', [TargetController::class, 'store']);
    Route::put('/{id}/update-achieved', [TargetController::class, 'updateAchieved']);
});
