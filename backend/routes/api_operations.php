<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ActivityPriceController;
use App\Http\Controllers\DayItineraryController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\HotelController;
use App\Http\Controllers\HotelRateController;
use App\Http\Controllers\HotelFinancialController;
use App\Http\Controllers\MealPlanController;
use App\Http\Controllers\ItineraryPricingController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\RoomTypeController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\TransferPriceController;
use App\Http\Controllers\VehicleFinancialController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Operations Management Routes
|--------------------------------------------------------------------------
*/

// Hotels routes - require authentication
Route::middleware(['auth:sanctum', 'plan.feature:hotels'])->prefix('hotels')->group(function () {
    Route::get('/search', [HotelController::class, 'search']);
    Route::get('/{hotelId}/rooms', [HotelController::class, 'getRooms']);

    // Part 4 - Hotel financial summary
    Route::get('/{hotelId}/financial-summary', [HotelFinancialController::class, 'getHotelFinancialSummary']);
    Route::post('/{hotelId}/lead-costs', [HotelFinancialController::class, 'storeLeadHotelCost']);
    Route::get('/{hotelId}/lead-costs', [HotelFinancialController::class, 'getHotelLeadCosts']);

    // Hotel import/export routes (must come before /{id} routes)
    Route::post('/import', [HotelController::class, 'import']);
    Route::get('/export', [HotelController::class, 'export']);
    Route::get('/import-template', [HotelController::class, 'downloadTemplate']);

    Route::post('/{id}', [HotelController::class, 'update']);
    Route::apiResource('/', HotelController::class)->parameters(['' => 'id'])->except(['destroy']);
    Route::delete('/{id}', [HotelController::class, 'destroy'])->middleware('role:Admin|Company Admin|Manager');

    // Hotel rates routes
    Route::get('/{hotelId}/rates', [HotelRateController::class, 'index']);
    Route::post('/{hotelId}/rates', [HotelRateController::class, 'store']);
    Route::put('/{hotelId}/rates/{id}', [HotelRateController::class, 'update']);
    Route::delete('/{hotelId}/rates/{id}', [HotelRateController::class, 'destroy']);
});

// Activities routes - require authentication
Route::middleware(['auth:sanctum', 'plan.feature:activities'])->prefix('activities')->group(function () {

    // Activity import/export routes (must come before /{id} routes)
    Route::post('/import', [ActivityController::class, 'import']);
    Route::get('/export', [ActivityController::class, 'export']);
    Route::get('/import-template', [ActivityController::class, 'downloadTemplate']);

    Route::post('/{id}', [ActivityController::class, 'update']);
    Route::apiResource('/', ActivityController::class)->parameters(['' => 'id'])->except(['destroy']);
    Route::delete('/{id}', [ActivityController::class, 'destroy'])->middleware('role:Admin|Company Admin|Manager');

    // Activity prices routes
    Route::get('/{activityId}/prices', [ActivityPriceController::class, 'index']);
    Route::post('/{activityId}/prices', [ActivityPriceController::class, 'store']);
    Route::put('/{activityId}/prices/{id}', [ActivityPriceController::class, 'update']);
    Route::delete('/{activityId}/prices/{id}', [ActivityPriceController::class, 'destroy']);
});

// Transfers routes - require authentication
Route::middleware(['auth:sanctum', 'plan.feature:transfers'])->prefix('transfers')->group(function () {

    // Transfer import/export routes (must come before /{id} routes)
    Route::post('/import', [TransferController::class, 'import']);
    Route::get('/export', [TransferController::class, 'export']);
    Route::get('/import-template', [TransferController::class, 'downloadTemplate']);

    // Part 3 - Vehicle financial summary
    Route::get('/{transferId}/financial-summary', [VehicleFinancialController::class, 'getVehicleFinancialSummary']);
    Route::post('/{transferId}/lead-costs', [VehicleFinancialController::class, 'storeLeadVehicleCost']);
    Route::get('/{transferId}/lead-costs', [VehicleFinancialController::class, 'getVehicleLeadCosts']);

    Route::post('/{id}', [TransferController::class, 'update']);
    Route::apiResource('/', TransferController::class)->parameters(['' => 'id'])->except(['destroy']);
    Route::delete('/{id}', [TransferController::class, 'destroy'])->middleware('role:Admin|Company Admin|Manager');

    // Transfer prices routes
    Route::get('/{transferId}/prices', [TransferPriceController::class, 'index']);
    Route::post('/{transferId}/prices', [TransferPriceController::class, 'store']);
    Route::put('/{transferId}/prices/{id}', [TransferPriceController::class, 'update']);
    Route::delete('/{transferId}/prices/{id}', [TransferPriceController::class, 'destroy']);
});

// Day Itineraries routes - require authentication
Route::middleware(['auth:sanctum', 'plan.feature:day_itineraries'])->prefix('day-itineraries')->group(function () {
    Route::post('/{id}', [DayItineraryController::class, 'update']);
    Route::apiResource('/', DayItineraryController::class)->parameters(['' => 'id'])->except(['destroy']);
    Route::delete('/{id}', [DayItineraryController::class, 'destroy'])->middleware('role:Admin|Company Admin|Manager');
});

// Packages/Itineraries routes - require authentication
Route::middleware(['auth:sanctum', 'plan.feature:itineraries'])->prefix('packages')->group(function () {
    Route::get('/', [PackageController::class, 'index']);
    Route::post('/', [PackageController::class, 'store']);
    Route::get('/{id}', [PackageController::class, 'show']);
    Route::put('/{id}', [PackageController::class, 'update']);
    Route::post('/{id}/duplicate', [PackageController::class, 'duplicate']);
    Route::delete('/{id}', [PackageController::class, 'destroy'])->middleware('role:Admin|Company Admin|Manager');

    // Itinerary pricing routes
    Route::get('/{id}/pricing', [ItineraryPricingController::class, 'show']);
    Route::put('/{id}/pricing', [ItineraryPricingController::class, 'upsert']);
});

// Destinations routes - require authentication
Route::middleware(['auth:sanctum', 'plan.feature:destinations'])->prefix('destinations')->group(function () {
    Route::apiResource('/', DestinationController::class)->parameters(['' => 'id'])->except(['destroy']);
    Route::delete('/{id}', [DestinationController::class, 'destroy'])->middleware('role:Admin|Company Admin|Manager');
});

// Room Types routes - require authentication
Route::middleware(['auth:sanctum', 'plan.feature:hotels'])->prefix('room-types')->group(function () {
    Route::apiResource('/', RoomTypeController::class)->parameters(['' => 'id'])->except(['destroy']);
    Route::delete('/{id}', [RoomTypeController::class, 'destroy'])->middleware('role:Admin|Company Admin|Manager');
});

// Meal Plans routes - require authentication
Route::middleware(['auth:sanctum', 'plan.feature:hotels'])->prefix('meal-plans')->group(function () {
    Route::apiResource('/', MealPlanController::class)->parameters(['' => 'id'])->except(['destroy']);
    Route::delete('/{id}', [MealPlanController::class, 'destroy'])->middleware('role:Admin|Company Admin|Manager');
});
