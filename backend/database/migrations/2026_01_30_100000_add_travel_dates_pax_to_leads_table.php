<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            if (!Schema::hasColumn('leads', 'travel_end_date')) {
                $table->date('travel_end_date')->nullable()->after('travel_start_date');
            }
            if (!Schema::hasColumn('leads', 'adult')) {
                $table->unsignedTinyInteger('adult')->default(1)->after('travel_end_date');
            }
            if (!Schema::hasColumn('leads', 'child')) {
                $table->unsignedTinyInteger('child')->default(0)->after('adult');
            }
            if (!Schema::hasColumn('leads', 'infant')) {
                $table->unsignedTinyInteger('infant')->default(0)->after('child');
            }
            if (!Schema::hasColumn('leads', 'remark')) {
                $table->text('remark')->nullable()->after('destination');
            }
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $cols = ['travel_end_date', 'adult', 'child', 'infant'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('leads', $col)) {
                    $table->dropColumn($col);
                }
            }
        });
    }
};
