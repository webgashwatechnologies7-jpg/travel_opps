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
        Schema::table('email_campaigns', function (Blueprint $table) {
            if (!Schema::hasColumn('email_campaigns', 'total_leads')) {
                $table->integer('total_leads')->default(0)->after('lead_ids');
            }
            if (!Schema::hasColumn('email_campaigns', 'failed_count')) {
                $table->integer('failed_count')->default(0)->after('sent_count');
            }
        });

        Schema::table('whatsapp_campaigns', function (Blueprint $table) {
            if (!Schema::hasColumn('whatsapp_campaigns', 'total_leads')) {
                $table->integer('total_leads')->default(0)->after('lead_ids');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('email_campaigns', function (Blueprint $table) {
            $table->dropColumn(['total_leads', 'failed_count']);
        });

        Schema::table('whatsapp_campaigns', function (Blueprint $table) {
            $table->dropColumn('total_leads');
        });
    }
};
