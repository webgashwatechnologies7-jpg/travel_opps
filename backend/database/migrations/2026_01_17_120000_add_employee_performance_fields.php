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
        Schema::create('employee_performance_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->date('date');
            $table->integer('leads_assigned')->default(0);
            $table->integer('leads_confirmed')->default(0);
            $table->integer('leads_cancelled')->default(0);
            $table->decimal('revenue_generated', 10, 2)->default(0);
            $table->decimal('target_amount', 10, 2)->default(0);
            $table->decimal('achievement_amount', 10, 2)->default(0);
            $table->timestamps();

            // Unique index on (user_id, date) to prevent duplicate entries
            $table->unique(['user_id', 'date'], 'employee_performance_user_date_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_performance_logs');
    }
};
