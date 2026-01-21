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
        Schema::create('call_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('companies')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('lead_id')->nullable()->constrained('leads')->nullOnDelete();
            $table->string('source', 20)->default('mobile');
            $table->string('status', 30)->default('unknown');
            $table->string('provider', 30)->nullable();
            $table->string('provider_call_id', 100)->nullable()->index();
            $table->string('recording_sid', 100)->nullable();
            $table->text('recording_url')->nullable();
            $table->unsignedInteger('duration_seconds')->default(0);
            $table->string('from_number', 32)->nullable();
            $table->string('from_number_normalized', 20)->nullable()->index();
            $table->string('to_number', 32)->nullable();
            $table->string('to_number_normalized', 20)->nullable()->index();
            $table->string('mapped_number', 32)->nullable();
            $table->string('mapped_number_normalized', 20)->nullable()->index();
            $table->string('contact_name', 100)->nullable();
            $table->string('contact_phone', 32)->nullable();
            $table->string('contact_phone_normalized', 20)->nullable()->index();
            $table->timestamp('call_started_at')->nullable();
            $table->timestamp('call_ended_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('call_logs');
    }
};
