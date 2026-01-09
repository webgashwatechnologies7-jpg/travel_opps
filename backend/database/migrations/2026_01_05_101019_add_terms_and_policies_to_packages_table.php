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
            $table->text('terms_conditions')->nullable()->after('notes');
            $table->text('refund_policy')->nullable()->after('terms_conditions');
            $table->text('package_description')->nullable()->after('refund_policy');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn(['terms_conditions', 'refund_policy', 'package_description']);
        });
    }
};
