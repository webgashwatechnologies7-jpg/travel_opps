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
        if (Schema::hasTable('whatsapp_sessions')) {
            Schema::table('whatsapp_sessions', function (Blueprint $table) {
                if (!Schema::hasColumn('whatsapp_sessions', 'session_data')) {
                    $table->longText('session_data')->nullable()->after('qr_code');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('whatsapp_sessions')) {
            Schema::table('whatsapp_sessions', function (Blueprint $table) {
                if (Schema::hasColumn('whatsapp_sessions', 'session_data')) {
                    $table->dropColumn('session_data');
                }
            });
        }
    }
};
