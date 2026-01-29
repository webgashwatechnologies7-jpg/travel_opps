<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\ActivityPriceController;
use App\Http\Controllers\DayItineraryController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\HotelController;
use App\Http\Controllers\HotelRateController;
use App\Http\Controllers\MealPlanController;
use App\Http\Controllers\ItineraryPricingController;
use App\Http\Controllers\PackageController;
use App\Http\Controllers\RoomTypeController;
use App\Http\Controllers\TransferController;
use App\Http\Controllers\TransferPriceController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Operations Management Routes
|--------------------------------------------------------------------------
*/

// Hotels routes - require authentication
Route::middleware('auth:sanctum')->prefix('hotels')->group(function () {
    Route::get('/', [HotelController::class, 'index']);
    Route::post('/', [HotelController::class, 'store']);
    Route::get('/search', [HotelController::class, 'search']);
    Route::get('/{hotelId}/rooms', [HotelController::class, 'getRooms']);

    // Hotel import/export routes (must come before /{id} routes)
    Route::post('/import', [HotelController::class, 'import']);
    Route::get('/export', [HotelController::class, 'export']);
    Route::get('/import-template', [HotelController::class, 'downloadTemplate']);

    Route::get('/{id}', [HotelController::class, 'show']);
    Route::post('/{id}', [HotelController::class, 'update']);
    Route::put('/{id}', [HotelController::class, 'update']);
    Route::delete('/{id}', [HotelController::class, 'destroy']);

    // Hotel rates routes
    Route::get('/{hotelId}/rates', [HotelRateController::class, 'index']);
    Route::post('/{hotelId}/rates', [HotelRateController::class, 'store']);
    Route::put('/{hotelId}/rates/{id}', [HotelRateController::class, 'update']);
    Route::delete('/{hotelId}/rates/{id}', [HotelRateController::class, 'destroy']);
});

// Activities routes - require authentication
Route::middleware('auth:sanctum')->prefix('activities')->group(function () {
    Route::get('/', [ActivityController::class, 'index']);
    Route::post('/', [ActivityController::class, 'store']);

    // Activity import/export routes (must come before /{id} routes)
    Route::post('/import', [ActivityController::class, 'import']);
    Route::get('/export', [ActivityController::class, 'export']);
    Route::get('/import-template', [ActivityController::class, 'downloadTemplate']);

    Route::get('/{id}', [ActivityController::class, 'show']);
    Route::post('/{id}', [ActivityController::class, 'update']);
    Route::put('/{id}', [ActivityController::class, 'update']);
    Route::delete('/{id}', [ActivityController::class, 'destroy']);

    // Activity prices routes
    Route::get('/{activityId}/prices', [ActivityPriceController::class, 'index']);
    Route::post('/{activityId}/prices', [ActivityPriceController::class, 'store']);
    Route::put('/{activityId}/prices/{id}', [ActivityPriceController::class, 'update']);
    Route::delete('/{activityId}/prices/{id}', [ActivityPriceController::class, 'destroy']);
});

// Transfers routes - require authentication
Route::middleware('auth:sanctum')->prefix('transfers')->group(function () {
    Route::get('/', [TransferController::class, 'index']);
    Route::post('/', [TransferController::class, 'store']);

    // Transfer import/export routes (must come before /{id} routes)
    Route::post('/import', [TransferController::class, 'import']);
    Route::get('/export', [TransferController::class, 'export']);
    Route::get('/import-template', [TransferController::class, 'downloadTemplate']);

    Route::get('/{id}', [TransferController::class, 'show']);
    Route::post('/{id}', [TransferController::class, 'update']);
    Route::put('/{id}', [TransferController::class, 'update']);
    Route::delete('/{id}', [TransferController::class, 'destroy']);

    // Transfer prices routes
    Route::get('/{transferId}/prices', [TransferPriceController::class, 'index']);
    Route::post('/{transferId}/prices', [TransferPriceController::class, 'store']);
    Route::put('/{transferId}/prices/{id}', [TransferPriceController::class, 'update']);
    Route::delete('/{transferId}/prices/{id}', [TransferPriceController::class, 'destroy']);
});

// Day Itineraries routes - require authentication
Route::middleware('auth:sanctum')->prefix('day-itineraries')->group(function () {
    Route::get('/', [DayItineraryController::class, 'index']);
    Route::post('/', [DayItineraryController::class, 'store']);
    Route::get('/{id}', [DayItineraryController::class, 'show']);
    Route::put('/{id}', [DayItineraryController::class, 'update']);
    Route::post('/{id}', [DayItineraryController::class, 'update']);
    Route::delete('/{id}', [DayItineraryController::class, 'destroy']);
});

// Packages/Itineraries routes - require authentication
Route::middleware('auth:sanctum')->prefix('packages')->group(function () {
    Route::get('/', [PackageController::class, 'index']);
    Route::post('/', [PackageController::class, 'store']);
    Route::get('/{id}', [PackageController::class, 'show']);
    Route::put('/{id}', [PackageController::class, 'update']);
    Route::delete('/{id}', [PackageController::class, 'destroy']);

    // Itinerary pricing routes
    Route::get('/{id}/pricing', [ItineraryPricingController::class, 'show']);
    Route::put('/{id}/pricing', [ItineraryPricingController::class, 'upsert']);
});

// Destinations routes - require authentication
Route::middleware('auth:sanctum')->prefix('destinations')->group(function () {
    Route::get('/', [DestinationController::class, 'index']);
    Route::post('/', [DestinationController::class, 'store']);
    Route::get('/{id}', [DestinationController::class, 'show']);
    Route::put('/{id}', [DestinationController::class, 'update']);
    Route::delete('/{id}', [DestinationController::class, 'destroy']);
});

// Room Types routes - require authentication
Route::middleware('auth:sanctum')->prefix('room-types')->group(function () {
    Route::get('/', [RoomTypeController::class, 'index']);
    Route::post('/', [RoomTypeController::class, 'store']);
    Route::get('/{id}', [RoomTypeController::class, 'show']);
    Route::put('/{id}', [RoomTypeController::class, 'update']);
    Route::delete('/{id}', [RoomTypeController::class, 'destroy']);
});

// Meal Plans routes - require authentication
Route::middleware('auth:sanctum')->prefix('meal-plans')->group(function () {
    Route::get('/', [MealPlanController::class, 'index']);
    Route::post('/', [MealPlanController::class, 'store']);
    Route::get('/{id}', [MealPlanController::class, 'show']);
    Route::put('/{id}', [MealPlanController::class, 'update']);
    Route::delete('/{id}', [MealPlanController::class, 'destroy']);
});
