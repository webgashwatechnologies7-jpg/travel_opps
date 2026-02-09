<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Stores supplier payables (kitna dena) and receivables (kitna lena).
     */
    public function up(): void
    {
        Schema::create('supplier_financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            $table->foreignId('supplier_id')->constrained('suppliers')->onDelete('cascade');
            $table->string('type', 20); // 'payable' = company owes supplier (dena), 'receivable' = supplier owes company (lena)
            $table->string('category', 50)->default('other');
            $table->decimal('amount', 12, 2);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->foreignId('lead_id')->nullable()->constrained('leads')->onDelete('set null');
            $table->date('transaction_date');
            $table->date('due_date')->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['company_id', 'supplier_id'], 'supp_fin_txn_company_supplier_idx');
            $table->index(['supplier_id', 'type', 'status'], 'supp_fin_txn_supplier_type_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('supplier_financial_transactions');
    }
};
