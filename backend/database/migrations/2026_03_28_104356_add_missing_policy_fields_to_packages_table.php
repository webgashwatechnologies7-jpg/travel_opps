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
        Schema::table('packages', function (Blueprint $table) {
            $table->text('confirmation_policy')->nullable()->after('refund_policy');
            $table->text('amendment_policy')->nullable()->after('confirmation_policy');
            $table->text('payment_policy')->nullable()->after('amendment_policy');
            $table->text('remarks')->nullable()->after('payment_policy');
            $table->text('thank_you_message')->nullable()->after('remarks');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn(['confirmation_policy', 'amendment_policy', 'payment_policy', 'remarks', 'thank_you_message']);
        });
    }
};
