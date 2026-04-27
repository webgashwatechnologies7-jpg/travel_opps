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
        Schema::table('itinerary_pricings', function (Blueprint $table) {
            $table->unsignedBigInteger('lead_id')->nullable()->after('package_id');
            
            // Add index for faster lookup
            $table->index(['package_id', 'lead_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('itinerary_pricings', function (Blueprint $table) {
            $table->dropIndex(['package_id', 'lead_id']);
            $table->dropColumn('lead_id');
        });
    }
};
