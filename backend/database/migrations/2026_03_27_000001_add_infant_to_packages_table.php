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
        if (!Schema::hasColumn('packages', 'infant')) {
            Schema::table('packages', function (Blueprint $table) {
                $table->integer('infant')->default(0)->after('child');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('packages', 'infant')) {
            Schema::table('packages', function (Blueprint $table) {
                $table->dropColumn('infant');
            });
        }
    }
};
