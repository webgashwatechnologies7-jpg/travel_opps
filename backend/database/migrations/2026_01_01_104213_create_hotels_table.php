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
        Schema::create('hotels', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('category')->nullable(); // 1-5 stars
            $table->string('destination');
            $table->text('hotel_details')->nullable();
            $table->string('hotel_photo')->nullable();
            $table->string('contact_person')->nullable();
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->text('hotel_address');
            $table->string('hotel_link')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->integer('price_updates_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            // Add indexes for fast search
            $table->index('name', 'hotels_name_index');
            $table->index('destination', 'hotels_destination_index');
            $table->index('status', 'hotels_status_index');
            $table->index('category', 'hotels_category_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hotels');
    }
};
