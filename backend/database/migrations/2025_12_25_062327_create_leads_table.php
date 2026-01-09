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
        Schema::create('leads', function (Blueprint $table) {
            $table->id();
            $table->string('client_name');
            $table->string('email')->nullable();
            $table->string('phone', 20)->nullable();
            $table->string('source', 50); // facebook, whatsapp, walkin, etc
            $table->string('destination')->nullable();
            $table->enum('status', ['new', 'proposal', 'followup', 'confirmed', 'cancelled'])->default('new');
            $table->foreignId('assigned_to')->nullable()->constrained('users')->onDelete('set null');
            $table->enum('priority', ['hot', 'warm', 'cold'])->default('warm');
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();

            // Add indexes for fast search
            $table->index('status', 'leads_status_index');
            $table->index('assigned_to', 'leads_assigned_to_index');
            $table->index('source', 'leads_source_index');
            $table->index('destination', 'leads_destination_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
