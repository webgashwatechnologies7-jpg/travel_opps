<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MasterPointController;

Route::middleware('auth:sanctum')->group(function () {
    Route::resource('master-points', MasterPointController::class)->except(['destroy']);
    Route::delete('master-points/{master_point}', [MasterPointController::class, 'destroy'])->middleware('role:Admin|Company Admin');
    Route::get('master-points-by-type/{type}', [MasterPointController::class, 'listByType']);
});
