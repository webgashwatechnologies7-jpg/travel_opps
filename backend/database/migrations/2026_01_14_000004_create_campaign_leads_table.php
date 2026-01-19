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
        Schema::create('campaign_leads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('email_campaign_id')->nullable()->constrained('email_campaigns')->onDelete('cascade');
            $table->foreignId('sms_campaign_id')->nullable()->constrained('sms_campaigns')->onDelete('cascade');
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->enum('status', ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'])->default('pending');
            $table->datetime('sent_at')->nullable();
            $table->datetime('delivered_at')->nullable();
            $table->datetime('opened_at')->nullable();
            $table->datetime('clicked_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
            
            // Indexes
            $table->index(['email_campaign_id', 'status']);
            $table->index(['sms_campaign_id', 'status']);
            $table->index('lead_id');
            
            // Ensure one lead is in only one campaign type at a time
            $table->unique(['lead_id', 'email_campaign_id']);
            $table->unique(['lead_id', 'sms_campaign_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaign_leads');
    }
};
