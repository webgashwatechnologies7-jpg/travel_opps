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
        Schema::table('campaign_leads', function (Blueprint $table) {
            $table->foreignId('whatsapp_campaign_id')->nullable()->after('sms_campaign_id')->constrained('whatsapp_campaigns')->onDelete('cascade');

            // Add unique constraint for whatsapp campaign
            $table->unique(['lead_id', 'whatsapp_campaign_id'], 'campaign_leads_lead_whatsapp_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('campaign_leads', function (Blueprint $table) {
            $table->dropUnique('campaign_leads_lead_whatsapp_unique');
            $table->dropForeign(['whatsapp_campaign_id']);
            $table->dropColumn('whatsapp_campaign_id');
        });
    }
};
