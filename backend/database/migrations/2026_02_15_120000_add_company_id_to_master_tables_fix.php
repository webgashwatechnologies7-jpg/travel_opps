<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration is a safety fix for AK TRAVEL CRM multi-tenant setup.
     * In some environments, the earlier migration that added company_id
     * to main tables ran before these tables existed. This ensures
     * company_id exists on all master tables used with HasCompany.
     */
    public function up(): void
    {
        $tables = [
            'suppliers',
            'hotels',
            'activities',
            'transfers',
            'destinations',
            'packages',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'company_id')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->foreignId('company_id')
                        ->nullable()
                        ->after('id')
                        ->constrained('companies')
                        ->onDelete('cascade');
                    $table->index('company_id');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = [
            'suppliers',
            'hotels',
            'activities',
            'transfers',
            'destinations',
            'packages',
        ];

        foreach ($tables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'company_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropForeign(['company_id']);
                    $table->dropColumn('company_id');
                });
            }
        }
    }
};

