<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('company_name')->nullable()->after('email');
            $table->string('gst_number')->nullable()->after('company_name');
            $table->string('city')->nullable()->after('gst_number');
            $table->string('user_type')->default('employee')->after('city');
            $table->string('role')->nullable()->after('user_type');
            $table->unsignedBigInteger('created_by')->nullable()->after('role');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['company_name', 'gst_number', 'city', 'user_type', 'role', 'created_by']);
        });
    }
};
