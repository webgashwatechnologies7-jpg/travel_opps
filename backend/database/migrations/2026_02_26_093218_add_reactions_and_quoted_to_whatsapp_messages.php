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
        Schema::table('whatsapp_messages', function (Blueprint $table) {
            $table->json('reactions')->nullable()->after('message');
            $table->string('quoted_message_id')->nullable()->after('whatsapp_message_id');
            $table->text('quoted_text')->nullable()->after('quoted_message_id');
            $table->boolean('is_reaction')->default(false)->after('direction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('whatsapp_messages', function (Blueprint $table) {
            $table->dropColumn(['reactions', 'quoted_message_id', 'quoted_text', 'is_reaction']);
        });
    }
};
