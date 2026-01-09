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
        Schema::create('transfers', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('destination');
            $table->text('transfer_details')->nullable();
            $table->string('transfer_photo')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->integer('price_updates_count')->default(0);
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            // Add indexes for fast search
            $table->index('name', 'transfers_name_index');
            $table->index('destination', 'transfers_destination_index');
            $table->index('status', 'transfers_status_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transfers');
    }
};

