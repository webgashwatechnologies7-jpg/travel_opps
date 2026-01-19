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
            // Add composite indexes for multi-company performance
            $table->index(['company_id', 'status'], 'leads_company_status_index');
            $table->index(['company_id', 'assigned_to'], 'leads_company_assigned_index');
            $table->index(['company_id', 'created_at'], 'leads_company_created_index');
            $table->index(['company_id', 'source'], 'leads_company_source_index');
            
            // Add full-text search index for client names
            $table->index('client_name', 'leads_client_name_index');
            $table->index('email', 'leads_email_index');
            $table->index('phone', 'leads_phone_index');
            
            // Add priority index for filtering
            $table->index(['company_id', 'priority'], 'leads_company_priority_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropIndex('leads_company_status_index');
            $table->dropIndex('leads_company_assigned_index');
            $table->dropIndex('leads_company_created_index');
            $table->dropIndex('leads_company_source_index');
            $table->dropIndex('leads_client_name_index');
            $table->dropIndex('leads_email_index');
            $table->dropIndex('leads_phone_index');
            $table->dropIndex('leads_company_priority_index');
        });
    }
};
