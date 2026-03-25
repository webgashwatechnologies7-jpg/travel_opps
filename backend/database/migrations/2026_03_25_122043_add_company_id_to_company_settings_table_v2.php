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
        if (Schema::hasTable('company_settings')) {
            Schema::table('company_settings', function (Blueprint $table) {
                if (!Schema::hasColumn('company_settings', 'company_id')) {
                    $table->unsignedBigInteger('company_id')->nullable()->after('id');
                    $table->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
                }
            });

            // Assign existing row to first company if available
            $firstCompany = \App\Models\Company::first();
            if ($firstCompany) {
                \DB::table('company_settings')->whereNull('company_id')->update(['company_id' => $firstCompany->id]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('company_settings')) {
            Schema::table('company_settings', function (Blueprint $table) {
                if (Schema::hasColumn('company_settings', 'company_id')) {
                    $table->dropForeign(['company_id']);
                    $table->dropColumn('company_id');
                }
            });
        }
    }
};
