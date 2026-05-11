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
        Schema::create('lead_proposals', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('company_id')->nullable();
            $table->unsignedBigInteger('lead_id')->nullable();
            $table->unsignedBigInteger('original_package_id')->nullable();
            $table->string('itinerary_name');
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->integer('adult')->default(0);
            $table->integer('child')->default(0);
            $table->integer('infant')->default(0);
            $table->text('destinations')->nullable();
            $table->text('routing')->nullable();
            $table->text('notes')->nullable();
            $table->json('terms_conditions')->nullable();
            $table->json('refund_policy')->nullable();
            $table->json('confirmation_policy')->nullable();
            $table->json('amendment_policy')->nullable();
            $table->json('payment_policy')->nullable();
            $table->json('remarks')->nullable();
            $table->json('thank_you_message')->nullable();
            $table->text('package_description')->nullable();
            $table->integer('duration')->nullable();
            $table->decimal('price', 15, 2)->default(0);
            $table->decimal('website_cost', 15, 2)->default(0);
            $table->boolean('show_on_website')->default(true);
            $table->string('image')->nullable();
            $table->json('day_events')->nullable();
            $table->json('days')->nullable();
            $table->json('options_data')->nullable();
            $table->json('inclusions')->nullable();
            $table->json('exclusions')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->index('lead_id');
            $table->index('original_package_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_proposals');
    }
};
