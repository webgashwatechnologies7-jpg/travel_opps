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
        Schema::table('lead_proposals', function (Blueprint $table) {
            $table->json('pricing_data')->nullable()->after('exclusions');
            $table->json('final_client_prices')->nullable()->after('pricing_data');
            $table->json('option_gst_settings')->nullable()->after('final_client_prices');
            $table->decimal('base_markup', 10, 2)->default(0)->after('option_gst_settings');
            $table->decimal('extra_markup', 10, 2)->default(0)->after('base_markup');
            $table->decimal('cgst', 5, 2)->default(0)->after('extra_markup');
            $table->decimal('sgst', 5, 2)->default(0)->after('cgst');
            $table->decimal('igst', 5, 2)->default(0)->after('sgst');
            $table->decimal('tcs', 5, 2)->default(0)->after('igst');
            $table->decimal('discount', 5, 2)->default(0)->after('tcs');
            $table->boolean('is_confirmed')->default(false)->after('discount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('lead_proposals', function (Blueprint $table) {
            $table->dropColumn([
                'pricing_data',
                'final_client_prices',
                'option_gst_settings',
                'base_markup',
                'extra_markup',
                'cgst',
                'sgst',
                'igst',
                'tcs',
                'discount',
                'is_confirmed'
            ]);
        });
    }
};
