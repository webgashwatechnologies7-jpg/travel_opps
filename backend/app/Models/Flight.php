<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Flight extends Model
{
    use HasFactory;

    protected $fillable = [
        'flight_code',
        'airline_name',
        'origin_airport_code',
        'origin_city',
        'destination_airport_code',
        'destination_city',
        'departure_time',
        'arrival_time',
        'duration',
        'price_economy',
        'price_business',
        'price_first',
        'currency',
        'is_direct',
        'stops',
        'aircraft_type',
        'seats_available_economy',
        'seats_available_business',
        'seats_available_first',
        'baggage_allowance',
        'cancellation_policy',
        'is_refundable',
        'source_api',
        'raw_response',
    ];

    protected $casts = [
        'departure_time' => 'datetime',
        'arrival_time' => 'datetime',
        'price_economy' => 'decimal:2',
        'price_business' => 'decimal:2',
        'price_first' => 'decimal:2',
        'is_direct' => 'boolean',
        'stops' => 'array',
        'seats_available_economy' => 'integer',
        'seats_available_business' => 'integer',
        'seats_available_first' => 'integer',
        'is_refundable' => 'boolean',
        'raw_response' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getFormattedDepartureAttribute(): string
    {
        return $this->departure_time ? $this->departure_time->format('Y-m-d H:i') : '';
    }

    public function getFormattedArrivalAttribute(): string
    {
        return $this->arrival_time ? $this->arrival_time->format('Y-m-d H:i') : '';
    }

    public function getRouteAttribute(): string
    {
        return "{$this->origin_airport_code} → {$this->destination_airport_code}";
    }

    public function getStopsCountAttribute(): int
    {
        return is_array($this->stops) ? count($this->stops) : 0;
    }
}
