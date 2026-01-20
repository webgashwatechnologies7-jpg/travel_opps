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
        Schema::create('sms_campaigns', function (Blueprint $table) {
            $table->id();

            $table->string('name');

            // FK column only (NO constraint here)
            $table->unsignedBigInteger('template_id')->nullable();

            $table->json('lead_ids'); // Array of Lead IDs
            $table->dateTime('scheduled_at')->nullable();
            $table->dateTime('sent_at')->nullable();

            $table->enum('status', [
                'draft',
                'scheduled',
                'sending',
                'sent',
                'failed',
                'cancelled'
            ])->default('draft');

            $table->integer('sent_count')->default(0);
            $table->integer('delivered_count')->default(0);
            $table->integer('read_count')->default(0);
            $table->integer('failed_count')->default(0);

            $table->foreignId('created_by')
                  ->constrained('users')
                  ->onDelete('cascade');

            $table->timestamps();

            // Indexes
            $table->index('status');
            $table->index('scheduled_at');
            $table->index('created_by');
        });

        // ✅ Add FK only if table exists
        if (Schema::hasTable('marketing_templates')) {
            Schema::table('sms_campaigns', function (Blueprint $table) {
                $table->foreign('template_id')
                      ->references('id')
                      ->on('marketing_templates')
                      ->onDelete('cascade');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sms_campaigns', function (Blueprint $table) {
            $table->dropForeign(['template_id']);
        });

        Schema::dropIfExists('sms_campaigns');
    }
};
