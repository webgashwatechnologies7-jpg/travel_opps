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
        // Table 1: whatsapp_sessions (Tracks Employee Phone Connections)
        Schema::create('whatsapp_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->string('session_name')->unique();
            $table->text('qr_code')->nullable();
            $table->enum('status', ['Disconnected', 'Scanning', 'Connected'])->default('Disconnected');
            $table->string('phone_number')->nullable();
            $table->longText('session_data')->nullable(); // Add this
            $table->boolean('is_encrypted')->default(true);
            $table->timestamps();

            $table->index(['user_id', 'company_id']);
        });

        // Table 2: whatsapp_chats (Manages Chat List Display)
        Schema::create('whatsapp_chats', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('lead_id')->nullable()->constrained('leads')->onDelete('set null');
            $table->string('chat_id'); // Unique WhatsApp JID (e.g., 919876543210@s.whatsapp.net)
            $table->integer('unread_count')->default(0);
            $table->timestamp('last_message_at')->nullable();
            $table->timestamps();

            $table->unique(['company_id', 'chat_id']);
            $table->index(['company_id', 'user_id']);
        });

        // Update existing whatsapp_messages table or add whatsapp_chat_id
        if (Schema::hasTable('whatsapp_messages')) {
            Schema::table('whatsapp_messages', function (Blueprint $table) {
                if (!Schema::hasColumn('whatsapp_messages', 'whatsapp_chat_id')) {
                    $table->foreignId('whatsapp_chat_id')->nullable()->after('lead_id')->constrained('whatsapp_chats')->onDelete('cascade');
                }
                // Ensure other fields from plan exist or align
                // Plan: body (we have 'message'), type (we have 'media_type'), 
                // direction (already exists), status (already exists)
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('whatsapp_messages')) {
            Schema::table('whatsapp_messages', function (Blueprint $table) {
                $table->dropForeign(['whatsapp_chat_id']);
                $table->dropColumn('whatsapp_chat_id');
            });
        }
        Schema::dropIfExists('whatsapp_chats');
        Schema::dropIfExists('whatsapp_sessions');
    }
};
