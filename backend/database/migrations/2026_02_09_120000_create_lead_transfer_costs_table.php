<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Links leads to transfers (vehicles) with cost - kitna vehicle cost for this lead.
     */
    public function up(): void
    {
        Schema::create('lead_transfer_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->foreignId('transfer_id')->constrained('transfers')->onDelete('cascade');
            $table->decimal('cost_amount', 12, 2);
            $table->decimal('revenue_amount', 12, 2)->default(0);
            $table->date('transaction_date');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['transfer_id', 'transaction_date'], 'lead_transfer_cost_transfer_date_idx');
            $table->index(['lead_id', 'transfer_id'], 'lead_transfer_cost_lead_transfer_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_transfer_costs');
    }
};
