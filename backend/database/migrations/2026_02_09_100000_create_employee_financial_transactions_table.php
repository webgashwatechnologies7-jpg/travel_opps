<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Stores employee payables (kitna dena) and receivables (kitna lena).
     */
    public function up(): void
    {
        Schema::create('employee_financial_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained('companies')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('type', 20); // 'payable' = company owes employee (dena), 'receivable' = employee owes company (lena)
            $table->string('category', 50)->default('other'); // commission, reimbursement, advance, bonus, etc.
            $table->decimal('amount', 12, 2);
            $table->decimal('paid_amount', 12, 2)->default(0); // how much already settled
            $table->foreignId('lead_id')->nullable()->constrained('leads')->onDelete('set null');
            $table->date('transaction_date');
            $table->date('due_date')->nullable();
            $table->string('status', 20)->default('pending'); // pending, partial, paid, settled
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();

            $table->index(['company_id', 'user_id'], 'emp_fin_txn_company_user_idx');
            $table->index(['company_id', 'user_id', 'transaction_date'], 'emp_fin_txn_company_user_date_idx');
            $table->index(['user_id', 'type', 'status'], 'emp_fin_txn_user_type_status_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employee_financial_transactions');
    }
};
