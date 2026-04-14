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
        Schema::table('leads', function (Blueprint $table) {
            // Update enum to include 'processing' and future-proof it by changing to string
            $table->string('status', 50)->default('new')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Revert back to original enum - NOTE: This will fail if status is 'processing'
            $table->enum('status', ['new', 'proposal', 'followup', 'confirmed', 'cancelled'])->default('new')->change();
        });
    }
};
