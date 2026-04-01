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
        Schema::table('company_settings', function (Blueprint $table) {
            $table->enum('attendance_mode', ['fixed_ip', 'flexible', 'location_based'])->default('flexible')->after('email_integration_enabled');
            $table->json('allowed_ips')->nullable()->after('attendance_mode');
            $table->time('default_punch_in_time')->default('09:30:00')->after('allowed_ips');
            $table->time('default_punch_out_time')->default('18:30:00')->after('default_punch_in_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('company_settings', function (Blueprint $table) {
            $table->dropColumn([
                'attendance_mode', 
                'allowed_ips', 
                'default_punch_in_time', 
                'default_punch_out_time'
            ]);
        });
    }
};
