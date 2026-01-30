<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE query_history_logs MODIFY activity_type VARCHAR(64) NOT NULL DEFAULT 'create'");
        } else {
            Schema::table('query_history_logs', function ($table) {
                $table->string('activity_type', 64)->default('create')->change();
            });
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();
        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE query_history_logs MODIFY activity_type ENUM(
                'create','update','delete','view','login','logout','email','call','meeting',
                'payment','approval','rejection','export','import','status_change','assignment','note_added'
            ) NOT NULL DEFAULT 'create'");
        } else {
            Schema::table('query_history_logs', function ($table) {
                $table->enum('activity_type', [
                    'create', 'update', 'delete', 'view', 'login', 'logout',
                    'email', 'call', 'meeting', 'payment', 'approval', 'rejection',
                    'export', 'import', 'status_change', 'assignment', 'note_added'
                ])->change();
            });
        }
    }
};
