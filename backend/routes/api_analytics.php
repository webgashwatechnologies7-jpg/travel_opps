<?php

use App\Modules\Dashboard\Presentation\Controllers\DashboardController;
use App\Modules\Dashboard\Presentation\Controllers\DestinationAnalyticsController;
use App\Modules\Dashboard\Presentation\Controllers\PerformanceController;
use App\Modules\Dashboard\Presentation\Controllers\ReportsController;
use App\Modules\Dashboard\Presentation\Controllers\SourceAnalyticsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dashboard & Analytics Routes
|--------------------------------------------------------------------------
*/

// Dashboard routes - require authentication
Route::middleware('auth:sanctum')->prefix('dashboard')->group(function () {
    Route::get('/stats', [DashboardController::class, 'stats']);
    Route::get('/revenue-growth-monthly', [DashboardController::class, 'getRevenueGrowthMonthly']);
    Route::get('/upcoming-tours', [DashboardController::class, 'upcomingTours']);
    Route::get('/latest-lead-notes', [DashboardController::class, 'latestLeadNotes']);
    Route::get('/sales-reps-stats', [DashboardController::class, 'salesRepsStats']);
    Route::get('/top-destinations', [DashboardController::class, 'topDestinations']);
    
    // Employee performance route - Admin only
    Route::middleware('role:Admin')->get('/employee-performance', [PerformanceController::class, 'employeePerformance']);
    // Source ROI analytics route - Admin only
    Route::middleware('role:Admin')->get('/source-roi', [SourceAnalyticsController::class, 'sourceRoi']);
    // Destination performance analytics route - Admin only
    Route::middleware('role:Admin')->get('/destination-performance', [DestinationAnalyticsController::class, 'destinationPerformance']);
});

// Reports routes - require authentication
Route::middleware('auth:sanctum')->prefix('reports')->group(function () {
    Route::get('/sales-summary', [ReportsController::class, 'salesSummary']);
    Route::get('/lead-funnel', [ReportsController::class, 'leadFunnel']);
    Route::get('/revenue-by-agent', [ReportsController::class, 'revenueByAgent']);
});
