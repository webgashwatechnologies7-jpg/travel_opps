<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Drop old unique constraint
        try {
            Schema::table('whatsapp_chats', function (Blueprint $table) {
                // Laravel 10/11 handles this better
                $table->dropUnique(['company_id', 'chat_id']);
            });
        } catch (\Exception $e) {
            // Already dropped or name mismatch
        }

        // 2. Add the new per-user unique constraint
        Schema::table('whatsapp_chats', function (Blueprint $table) {
            $table->unique(['company_id', 'user_id', 'chat_id'], 'wa_chats_user_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('whatsapp_chats', function (Blueprint $table) {
            $table->dropUnique('wa_chats_user_unique');
            $table->unique(['company_id', 'chat_id']);
        });
    }
};
