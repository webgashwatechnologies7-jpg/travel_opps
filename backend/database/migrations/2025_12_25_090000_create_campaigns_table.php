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
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('channel', ['whatsapp', 'email']);
            $table->text('message_template');
            $table->string('target_source')->nullable(); // Filter leads by source
            $table->timestamp('schedule_at')->nullable(); // When to run the campaign
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamp('last_run_at')->nullable();
            $table->integer('total_sent')->default(0);
            $table->timestamps();

            // Add indexes for fast search
            $table->index('channel', 'campaigns_channel_index');
            $table->index('target_source', 'campaigns_target_source_index');
            $table->index('schedule_at', 'campaigns_schedule_at_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};

