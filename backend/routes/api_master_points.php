<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\MasterPointController;

Route::middleware('auth:sanctum')->group(function () {
    Route::resource('master-points', MasterPointController::class);
    Route::get('master-points-by-type/{type}', [MasterPointController::class, 'listByType']);
});
