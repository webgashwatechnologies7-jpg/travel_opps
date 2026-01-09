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
        Schema::create('packages', function (Blueprint $table) {
            $table->id();
            $table->string('itinerary_name');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('adult')->default(1);
            $table->integer('child')->default(0);
            $table->text('destinations')->nullable();
            $table->text('notes')->nullable();
            $table->integer('duration')->nullable(); // Calculated from start_date and end_date
            $table->decimal('price', 10, 2)->default(0);
            $table->decimal('website_cost', 10, 2)->default(0);
            $table->boolean('show_on_website')->default(false);
            $table->string('image')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            // Add indexes for fast search
            $table->index('itinerary_name', 'packages_name_index');
            $table->index('start_date', 'packages_start_date_index');
            $table->index('show_on_website', 'packages_show_on_website_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('packages');
    }
};

