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
        Schema::table('destinations', function (Blueprint $table) {
            // Drop old global unique index if exists
            try {
                $table->dropUnique('destinations_name_unique');
            } catch (\Exception $e) {}

            // Add created_by if missing
            if (!Schema::hasColumn('destinations', 'created_by')) {
                $table->foreignId('created_by')->nullable()->after('status')->constrained('users')->onDelete('set null');
            }

            // Add multi-tenant unique constraint
            $table->unique(['name', 'company_id'], 'destinations_name_company_unique');
        });
    }

    public function down(): void
    {
        Schema::table('destinations', function (Blueprint $table) {
            $table->dropUnique('destinations_name_company_unique');
            $table->unique('name');
            $table->dropColumn('created_by');
        });
    }
};
