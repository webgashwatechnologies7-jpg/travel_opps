<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Integration flag: company admin configures email in Settings → Email Integration; once saved, flag is set.
     */
    public function up(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('company_settings', 'email_integration_enabled')) {
                $table->boolean('email_integration_enabled')->default(false)->after('header_background_color');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            if (Schema::hasColumn('company_settings', 'email_integration_enabled')) {
                $table->dropColumn('email_integration_enabled');
            }
        });
    }
};
