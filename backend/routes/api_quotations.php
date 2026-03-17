<?php

use App\Http\Controllers\QuotationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('quotations')->group(function () {
    Route::post('/{id}/send', [QuotationController::class, 'send']);
    Route::get('/{id}/preview', [QuotationController::class, 'preview']);
    Route::get('/{id}/download', [QuotationController::class, 'download']);
    Route::apiResource('/', QuotationController::class)->parameters(['' => 'id']);
});
