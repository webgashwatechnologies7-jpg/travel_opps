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
        Schema::create('whatsapp_messages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->constrained('companies')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('lead_id')->nullable()->constrained('leads')->onDelete('set null');
            
            // WhatsApp specific fields
            $table->string('whatsapp_message_id')->unique();
            $table->string('from')->nullable(); // Sender phone number
            $table->string('to')->nullable();   // Receiver phone number
            $table->text('message')->nullable();
            $table->enum('direction', ['inbound', 'outbound'])->default('outbound');
            $table->enum('status', ['sent', 'delivered', 'read', 'failed', 'received'])->default('sent');
            
            // Media fields
            $table->string('media_url')->nullable();
            $table->enum('media_type', ['image', 'document', 'audio', 'video'])->nullable();
            $table->string('media_caption')->nullable();
            
            // Template fields
            $table->boolean('is_template')->default(false);
            $table->string('template_name')->nullable();
            $table->json('template_data')->nullable();
            
            // Timestamps
            $table->timestamp('received_at')->nullable();
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['company_id', 'from'], 'whatsapp_company_from_index');
            $table->index(['company_id', 'to'], 'whatsapp_company_to_index');
            $table->index(['company_id', 'lead_id'], 'whatsapp_company_lead_index');
            $table->index(['company_id', 'status'], 'whatsapp_company_status_index');
            $table->index(['whatsapp_message_id'], 'whatsapp_message_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_messages');
    }
};
