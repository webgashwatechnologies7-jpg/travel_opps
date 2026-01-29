<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Store which employee (user) sent the message so admin can see per-user WhatsApp chats.
     */
    public function up(): void
    {
        Schema::table('whatsapp_logs', function (Blueprint $table) {
            if (!Schema::hasColumn('whatsapp_logs', 'user_id')) {
                $table->foreignId('user_id')->nullable()->after('lead_id')->constrained('users')->onDelete('set null');
                $table->index('user_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('whatsapp_logs', function (Blueprint $table) {
            if (Schema::hasColumn('whatsapp_logs', 'user_id')) {
                $table->dropForeign(['user_id']);
                $table->dropIndex(['user_id']);
            }
        });
    }
};
