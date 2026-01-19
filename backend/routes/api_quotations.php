<?php

use App\Http\Controllers\QuotationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('quotations')->group(function () {
    Route::get('/', [QuotationController::class, 'index']);
    Route::post('/', [QuotationController::class, 'store']);
    Route::get('/{id}', [QuotationController::class, 'show']);
    Route::put('/{id}', [QuotationController::class, 'update']);
    Route::delete('/{id}', [QuotationController::class, 'destroy']);
    Route::post('/{id}/send', [QuotationController::class, 'send']);
    Route::get('/{id}/preview', [QuotationController::class, 'preview']);
    Route::get('/{id}/download', [QuotationController::class, 'download']);
});
