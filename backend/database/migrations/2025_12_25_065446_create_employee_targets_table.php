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
        Schema::create('employee_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('month', 7); // Format: YYYY-MM (e.g., 2025-12)
            $table->decimal('target_amount', 10, 2);
            $table->decimal('achieved_amount', 10, 2)->default(0);
            $table->timestamps();

            // Unique index on (user_id, month) to prevent duplicate targets for same user/month
            $table->unique(['user_id', 'month'], 'employee_targets_user_month_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_targets');
    }
};
