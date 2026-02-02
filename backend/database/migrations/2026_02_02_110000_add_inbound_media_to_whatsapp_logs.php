<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('whatsapp_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('whatsapp_logs', 'direction')) {
                $table->enum('direction', ['inbound', 'outbound'])->default('outbound')->after('message');
            }
            if (!Schema::hasColumn('whatsapp_logs', 'from_phone')) {
                $table->string('from_phone', 50)->nullable()->after('sent_to');
            }
            if (!Schema::hasColumn('whatsapp_logs', 'media_url')) {
                $table->string('media_url', 500)->nullable()->after('message');
            }
            if (!Schema::hasColumn('whatsapp_logs', 'media_type')) {
                $table->string('media_type', 20)->nullable()->after('media_url');
            }
        });
    }

    public function down(): void
    {
        Schema::table('whatsapp_logs', function (Blueprint $table) {
            $columns = ['direction', 'from_phone', 'media_url', 'media_type'];
            foreach ($columns as $col) {
                if (Schema::hasColumn('whatsapp_logs', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
