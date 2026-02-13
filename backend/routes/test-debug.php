<?php

use Illuminate\Support\Facades\Route;
use App\Models\Quotation;

Route::get('/test-pdf-render/{id}', function ($id) {
    $quotation = Quotation::with('lead.company')->find($id);

    if (!$quotation) {
        return 'Quotation not found';
    }

    // Check what data we have
    $debug = [
        'has_itinerary' => !empty($quotation->itinerary),
        'has_custom_fields' => !empty($quotation->custom_fields),
        'has_hotel_options' => isset($quotation->custom_fields['hotel_options']),
        'itinerary_keys' => $quotation->itinerary ? array_keys($quotation->itinerary) : [],
        'custom_fields_keys' => $quotation->custom_fields ? array_keys($quotation->custom_fields) : [],
    ];

    return '<pre>' . print_r($debug, true) . '</pre>';
});
