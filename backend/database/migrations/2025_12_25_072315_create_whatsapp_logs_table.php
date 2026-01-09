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
        Schema::create('whatsapp_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->onDelete('set null');
            $table->string('sent_to', 50); // Phone number
            $table->text('message');
            $table->timestamp('sent_at');
            $table->timestamps();

            // Add indexes for fast search
            $table->index('lead_id', 'whatsapp_logs_lead_id_index');
            $table->index('sent_at', 'whatsapp_logs_sent_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('whatsapp_logs');
    }
};
