<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Master Features Table (Single Source of Truth)
        Schema::create('subscription_features', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique(); // e.g., 'whatsapp_integration'
            $table->string('name'); // e.g., 'WhatsApp Integration'
            $table->text('description')->nullable();
            $table->boolean('has_limit')->default(false); // If feature has quota
            $table->string('limit_label')->nullable(); // e.g., 'Messages per month'
            $table->timestamps();
        });

        // 2. Pivot Table (Plan <-> Feature)
        Schema::create('plan_features', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subscription_plan_id')->constrained('subscription_plans')->onDelete('cascade');
            $table->foreignId('subscription_feature_id')->constrained('subscription_features')->onDelete('cascade');
            $table->boolean('is_active')->default(true); // Toggle ON/OFF per plan
            $table->integer('limit_value')->nullable(); // Override limit for this plan
            $table->timestamps();

            // Prevent duplicate feature per plan
            $table->unique(['subscription_plan_id', 'subscription_feature_id'], 'plan_feature_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('plan_features');
        Schema::dropIfExists('subscription_features');
    }
};
