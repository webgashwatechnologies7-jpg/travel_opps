<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Links leads to hotels with cost - kitna hotel cost for this lead.
     */
    public function up(): void
    {
        Schema::create('lead_hotel_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->foreignId('hotel_id')->constrained('hotels')->onDelete('cascade');
            $table->decimal('cost_amount', 12, 2);
            $table->decimal('revenue_amount', 12, 2)->default(0);
            $table->date('transaction_date');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['hotel_id', 'transaction_date'], 'lead_hotel_cost_hotel_date_idx');
            $table->index(['lead_id', 'hotel_id'], 'lead_hotel_cost_lead_hotel_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lead_hotel_costs');
    }
};
