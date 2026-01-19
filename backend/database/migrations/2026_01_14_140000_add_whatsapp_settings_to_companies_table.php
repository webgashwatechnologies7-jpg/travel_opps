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
        Schema::table('companies', function (Blueprint $table) {
            // WhatsApp Business Settings
            $table->string('whatsapp_phone_number')->nullable();
            $table->string('whatsapp_api_key')->nullable();
            $table->string('whatsapp_phone_number_id')->nullable();
            $table->string('whatsapp_webhook_secret')->nullable();
            $table->string('whatsapp_verify_token')->nullable();
            $table->boolean('whatsapp_enabled')->default(false);
            $table->enum('whatsapp_status', ['not_configured', 'pending', 'active', 'error'])->default('not_configured');
            $table->timestamp('whatsapp_last_sync')->nullable();
            
            // WhatsApp Business Account Info
            $table->string('whatsapp_business_account_id')->nullable();
            $table->string('whatsapp_waba_id')->nullable();
            $table->string('whatsapp_display_name')->nullable();
            
            // Auto-provisioning Settings
            $table->boolean('auto_provision_whatsapp')->default(true);
            $table->json('whatsapp_settings')->nullable(); // Additional settings
            
            // Indexes
            $table->index('whatsapp_enabled');
            $table->index('whatsapp_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'whatsapp_phone_number',
                'whatsapp_api_key',
                'whatsapp_phone_number_id',
                'whatsapp_webhook_secret',
                'whatsapp_verify_token',
                'whatsapp_enabled',
                'whatsapp_status',
                'whatsapp_last_sync',
                'whatsapp_business_account_id',
                'whatsapp_waba_id',
                'whatsapp_display_name',
                'auto_provision_whatsapp',
                'whatsapp_settings'
            ]);
        });
    }
};
