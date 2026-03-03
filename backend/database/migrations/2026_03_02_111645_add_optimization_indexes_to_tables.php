<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            // Composite indexes for multi-tenant filtering
            $table->index(['company_id', 'status'], 'idx_leads_company_status');
            $table->index(['company_id', 'assigned_to'], 'idx_leads_company_assigned_to');
            $table->index(['company_id', 'created_at'], 'idx_leads_company_created_at');
            $table->index('client_name', 'idx_leads_client_name');
            $table->index('phone', 'idx_leads_phone');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->index('company_id', 'idx_users_company_id');
            $table->index('email', 'idx_users_email');
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->index('key', 'idx_settings_key');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex('idx_leads_company_status');
            $table->dropIndex('idx_leads_company_assigned_to');
            $table->dropIndex('idx_leads_company_created_at');
            $table->dropIndex('idx_leads_client_name');
            $table->dropIndex('idx_leads_phone');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_company_id');
            $table->dropIndex('idx_users_email');
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->dropIndex('idx_settings_key');
        });
    }
};
