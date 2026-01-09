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
        // Drop table if exists (for fixing migration issues)
        Schema::dropIfExists('subscription_plan_features');
        
        Schema::create('subscription_plan_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_plan_id')->constrained('subscription_plans')->onDelete('cascade');
            $table->string('feature_key'); // e.g., 'leads_management', 'whatsapp'
            $table->string('feature_name'); // Display name
            $table->boolean('is_enabled')->default(true);
            $table->integer('limit_value')->nullable(); // For features with limits
            $table->timestamps();
            
            // Ensure one feature per plan (short name for MySQL 64 char limit)
            $table->unique(['subscription_plan_id', 'feature_key'], 'plan_feature_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_plan_features');
    }
};
