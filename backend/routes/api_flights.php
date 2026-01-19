<?php

use App\Http\Controllers\FlightController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth:sanctum')->prefix('flights')->group(function () {
    Route::get('/search', [FlightController::class, 'search']);
});
