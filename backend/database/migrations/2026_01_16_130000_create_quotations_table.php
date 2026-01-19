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
        Schema::create('quotations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->string('quotation_number')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->date('travel_start_date');
            $table->date('travel_end_date');
            $table->integer('adults')->default(1);
            $table->integer('children')->default(0);
            $table->integer('infants')->default(0);
            $table->decimal('base_price', 12, 2)->default(0);
            $table->decimal('tax_amount', 12, 2)->default(0);
            $table->decimal('discount_amount', 12, 2)->default(0);
            $table->decimal('total_price', 12, 2)->default(0);
            $table->string('currency', 3)->default('INR');
            $table->enum('status', ['draft', 'sent', 'accepted', 'rejected', 'expired'])->default('draft');
            $table->date('valid_until')->nullable();
            $table->string('template')->default('default'); // default, premium, budget
            $table->json('itinerary')->nullable(); // day-wise itinerary
            $table->json('inclusions')->nullable(); // included services
            $table->json('exclusions')->nullable(); // excluded services
            $table->json('pricing_breakdown')->nullable(); // flight, hotel, transport, etc.
            $table->json('custom_fields')->nullable(); // extra fields
            $table->text('notes')->nullable();
            $table->text('terms_conditions')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();

            // Indexes
            $table->index('lead_id', 'quotations_lead_id_index');
            $table->index('quotation_number', 'quotations_number_index');
            $table->index('status', 'quotations_status_index');
            $table->index('valid_until', 'quotations_valid_until_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quotations');
    }
};
