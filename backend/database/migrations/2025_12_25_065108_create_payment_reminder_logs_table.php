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
        Schema::create('payment_reminder_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('payment_id')->constrained('lead_payments')->onDelete('cascade');
            $table->string('sent_to', 50); // Phone number or email
            $table->timestamp('sent_at');
            $table->timestamps();

            // Add index for payment_id
            $table->index('payment_id', 'payment_reminder_logs_payment_id_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_reminder_logs');
    }
};
