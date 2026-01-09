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
        Schema::create('activity_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('activity_id')->constrained('activities')->onDelete('cascade');
            $table->date('from_date');
            $table->date('to_date');
            $table->decimal('price', 10, 2);
            $table->timestamps();

            // Add indexes
            $table->index('activity_id', 'activity_prices_activity_id_index');
            $table->index(['from_date', 'to_date'], 'activity_prices_dates_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_prices');
    }
};
