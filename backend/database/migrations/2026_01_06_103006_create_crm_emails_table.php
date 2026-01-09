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
        Schema::create('crm_emails', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('lead_id')->nullable();
            $table->string('from_email');
            $table->string('to_email');
            $table->string('subject');
            $table->longText('body');
            $table->string('thread_id')->nullable();
            $table->string('gmail_message_id')->unique()->nullable();
            $table->enum('direction', ['inbound', 'outbound']);
            $table->enum('status', ['sent', 'failed', 'received']);
            $table->timestamps();

            $table->foreign('lead_id')->references('id')->on('leads')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('crm_emails');
    }
};
