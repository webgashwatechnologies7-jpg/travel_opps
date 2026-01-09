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
        Schema::create('company_settings', function (Blueprint $table) {
            $table->id();
            $table->string('sidebar_color')->default('#2765B0'); // Default sidebar color
            $table->string('dashboard_background_color')->default('#D8DEF5'); // Default dashboard background
            $table->string('header_background_color')->default('#D8DEF5'); // Default header background
            $table->timestamps();
        });

        // Insert default settings
        \Illuminate\Support\Facades\DB::table('company_settings')->insert([
            'sidebar_color' => '#2765B0',
            'dashboard_background_color' => '#D8DEF5',
            'header_background_color' => '#D8DEF5',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_settings');
    }
};

