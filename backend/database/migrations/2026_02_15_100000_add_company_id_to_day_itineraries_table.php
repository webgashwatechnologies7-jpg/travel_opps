<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * AK TRAVEL CRM: Multi-tenant isolation - each company sees only its day itineraries.
     */
    public function up(): void
    {
        Schema::table('day_itineraries', function (Blueprint $table) {
            if (!Schema::hasColumn('day_itineraries', 'company_id')) {
                $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                $table->index('company_id');
            }
        });

        // Backfill company_id from creator's company (for existing rows)
        if (Schema::hasColumn('day_itineraries', 'company_id') && Schema::hasColumn('day_itineraries', 'created_by')) {
            DB::statement('
                update day_itineraries di
                join users u on u.id = di.created_by and u.company_id is not null
                set di.company_id = u.company_id
                where di.company_id is null
            ');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('day_itineraries', function (Blueprint $table) {
            if (Schema::hasColumn('day_itineraries', 'company_id')) {
                $table->dropForeign(['company_id']);
                $table->dropColumn('company_id');
            }
        });
    }
};
