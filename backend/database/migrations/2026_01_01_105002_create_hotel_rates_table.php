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
        Schema::create('hotel_rates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained('hotels')->onDelete('cascade');
            $table->date('from_date');
            $table->date('to_date');
            $table->string('room_type');
            $table->string('meal_plan'); // BB, HB, FB, etc.
            $table->decimal('single', 10, 2)->nullable();
            $table->decimal('double', 10, 2)->nullable();
            $table->decimal('triple', 10, 2)->nullable();
            $table->decimal('quad', 10, 2)->nullable();
            $table->decimal('cwb', 10, 2)->nullable(); // Child With Bed
            $table->decimal('cnb', 10, 2)->nullable(); // Child No Bed
            $table->timestamps();

            // Add indexes
            $table->index('hotel_id', 'hotel_rates_hotel_id_index');
            $table->index(['from_date', 'to_date'], 'hotel_rates_dates_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hotel_rates');
    }
};
