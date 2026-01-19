<?php

use App\Http\Controllers\VoucherController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('vouchers')->group(function () {
    Route::get('/lead/{leadId}/preview', [VoucherController::class, 'preview']);
    Route::get('/lead/{leadId}/download', [VoucherController::class, 'download']);
});
