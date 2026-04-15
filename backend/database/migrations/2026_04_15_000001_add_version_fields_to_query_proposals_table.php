<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Adds version tracking fields so old itineraries are archived instead of deleted.
     */
    public function up(): void
    {
        Schema::table('query_proposals', function (Blueprint $table) {
            // 'active' = currently selected itinerary for this lead
            // 'archived' = previously selected itinerary (history)
            $table->enum('version_status', ['active', 'archived'])->default('active')->after('status');
            // Which version number is this? 1 = first, 2 = second change, etc.
            $table->unsignedInteger('version_number')->default(1)->after('version_status');
            // When was this version archived (i.e., when did the user change the itinerary)
            $table->timestamp('archived_at')->nullable()->after('version_number');
            // Who archived it
            $table->unsignedBigInteger('archived_by')->nullable()->after('archived_at');

            $table->index(['lead_id', 'version_status']);
            $table->index(['lead_id', 'version_number']);
        });

        // Mark all existing proposals as active version 1
        \Illuminate\Support\Facades\DB::table('query_proposals')
            ->update(['version_status' => 'active', 'version_number' => 1]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('query_proposals', function (Blueprint $table) {
            $table->dropColumn(['version_status', 'version_number', 'archived_at', 'archived_by']);
        });
    }
};
