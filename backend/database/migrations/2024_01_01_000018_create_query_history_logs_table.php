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
        Schema::create('query_history_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->enum('activity_type', [
                'create', 'update', 'delete', 'view', 'login', 'logout',
                'email', 'call', 'meeting', 'payment', 'approval', 'rejection',
                'export', 'import', 'status_change', 'assignment', 'note_added'
            ]);
            $table->string('activity_description');
            $table->string('module')->nullable(); // proposals, followups, documents, etc.
            $table->unsignedBigInteger('record_id')->nullable(); // ID of the affected record
            $table->json('old_values')->nullable(); // Previous values before change
            $table->json('new_values')->nullable(); // New values after change
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->json('metadata')->nullable(); // Additional context data
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['lead_id', 'activity_type']);
            $table->index(['user_id']);
            $table->index(['module', 'record_id']);
            $table->index(['created_at']);
            $table->index(['activity_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('query_history_logs');
    }
};