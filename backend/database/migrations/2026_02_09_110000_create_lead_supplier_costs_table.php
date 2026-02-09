<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Links leads to suppliers with cost amount - kitna supplier ko dena hai for this lead.
     */
    public function up(): void
    {
        Schema::create('lead_supplier_costs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('cascade');
            $table->decimal('cost_amount', 12, 2);
            $table->string('service_type', 50)->nullable(); // hotel, vehicle, transfer, activity, etc.
            $table->date('transaction_date');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['supplier_id', 'transaction_date'], 'lead_supp_cost_supplier_date_idx');
            $table->index(['lead_id', 'supplier_id'], 'lead_supp_cost_lead_supp_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('lead_supplier_costs');
    }
};
