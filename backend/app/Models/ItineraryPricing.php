<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ItineraryPricing extends Model
{
    use HasFactory;

    protected $table = 'itinerary_pricings';

    protected $fillable = [
        'package_id',
        'pricing_data',
        'final_client_prices',
        'option_gst_settings',
        'base_markup',
        'extra_markup',
        'cgst',
        'sgst',
        'igst',
        'tcs',
        'discount',
    ];

    protected $casts = [
        'pricing_data' => 'array',
        'final_client_prices' => 'array',
        'option_gst_settings' => 'array',
        'base_markup' => 'decimal:2',
        'extra_markup' => 'decimal:2',
        'cgst' => 'decimal:2',
        'sgst' => 'decimal:2',
        'igst' => 'decimal:2',
        'tcs' => 'decimal:2',
        'discount' => 'decimal:2',
    ];

    public function package(): BelongsTo
    {
        return $this->belongsTo(Package::class);
    }
}

