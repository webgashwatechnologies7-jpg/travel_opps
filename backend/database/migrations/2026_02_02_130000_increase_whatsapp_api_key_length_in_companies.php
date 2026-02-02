<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Meta WhatsApp Access Tokens can exceed 255 chars - extend column.
     */
    public function up(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE companies MODIFY whatsapp_api_key TEXT NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE companies ALTER COLUMN whatsapp_api_key TYPE TEXT');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            DB::statement('ALTER TABLE companies MODIFY whatsapp_api_key VARCHAR(255) NULL');
        } elseif ($driver === 'pgsql') {
            DB::statement('ALTER TABLE companies ALTER COLUMN whatsapp_api_key TYPE VARCHAR(255)');
        }
    }
};
