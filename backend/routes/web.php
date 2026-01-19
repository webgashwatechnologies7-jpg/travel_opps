<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Response;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});

// Add a simple login route for web middleware
Route::get('/login', function () {
    return response()->json(['message' => 'Please use API login endpoint'], 401);
})->name('login');

use App\Http\Controllers\GoogleController;

Route::middleware('auth')->group(function () {
    Route::get('/google/connect', [GoogleController::class, 'connect'])->name('google.connect');
    Route::get('/google/callback', [GoogleController::class, 'callback'])->name('google.callback');
});
