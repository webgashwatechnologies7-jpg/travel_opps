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
        Schema::create('itinerary_pricings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('package_id');
            $table->json('pricing_data')->nullable();
            $table->json('final_client_prices')->nullable();
            $table->json('option_gst_settings')->nullable();
            $table->decimal('base_markup', 10, 2)->default(0);
            $table->decimal('extra_markup', 10, 2)->default(0);
            $table->decimal('cgst', 5, 2)->default(0);
            $table->decimal('sgst', 5, 2)->default(0);
            $table->decimal('igst', 5, 2)->default(0);
            $table->decimal('tcs', 5, 2)->default(0);
            $table->decimal('discount', 5, 2)->default(0);
            $table->timestamps();

            $table->foreign('package_id')
                ->references('id')
                ->on('packages')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('itinerary_pricings');
    }
};

