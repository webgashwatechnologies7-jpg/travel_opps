<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('flights', function (Blueprint $table) {
            $table->id();
            $table->string('flight_code', 10); // e.g., AI123
            $table->string('airline_name', 100);
            $table->string('origin_airport_code', 10); // e.g., DEL
            $table->string('origin_city', 100);
            $table->string('destination_airport_code', 10); // e.g., BOM
            $table->string('destination_city', 100);
            $table->dateTime('departure_time');
            $table->dateTime('arrival_time');
            $table->string('duration', 20); // e.g., 2h 30m
            $table->decimal('price_economy', 10, 2)->default(0);
            $table->decimal('price_business', 10, 2)->nullable();
            $table->decimal('price_first', 10, 2)->nullable();
            $table->string('currency', 3)->default('INR');
            $table->boolean('is_direct')->default(true);
            $table->json('stops')->nullable(); // array of stop info
            $table->string('aircraft_type', 50)->nullable();
            $table->integer('seats_available_economy')->default(0);
            $table->integer('seats_available_business')->default(0);
            $table->integer('seats_available_first')->default(0);
            $table->string('baggage_allowance')->nullable();
            $table->string('cancellation_policy')->nullable();
            $table->boolean('is_refundable')->default(false);
            $table->string('source_api')->nullable(); // amadeus, duffel, rapidapi, mock
            $table->json('raw_response')->nullable(); // store raw API response
            $table->timestamps();

            // Indexes
            $table->index(['origin_airport_code', 'destination_airport_code'], 'flights_route_index');
            $table->index('departure_time', 'flights_departure_index');
            $table->index('flight_code', 'flights_code_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('flights');
    }
};
