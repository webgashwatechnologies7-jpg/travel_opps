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
        Schema::table('users', function (Blueprint $table) {
            $table->decimal('base_salary', 12, 2)->nullable()->after('reports_to');
            $table->enum('salary_type', ['monthly', 'daily', 'hourly'])->default('monthly')->after('base_salary');
            $table->decimal('overtime_rate', 10, 2)->default(0)->after('salary_type'); // Per hour
            $table->decimal('working_hours_per_day', 4, 2)->default(9)->after('overtime_rate');
            $table->boolean('allow_remote_attendance')->default(false)->after('working_hours_per_day');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'base_salary', 
                'salary_type', 
                'overtime_rate', 
                'working_hours_per_day', 
                'allow_remote_attendance'
            ]);
        });
    }
};
