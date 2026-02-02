<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('crm_emails', function (Blueprint $table) {
            $table->boolean('is_read')->default(false)->after('status');
            $table->timestamp('opened_at')->nullable()->after('is_read');
            $table->string('track_token', 64)->nullable()->unique()->after('opened_at');
        });
    }

    public function down(): void
    {
        Schema::table('crm_emails', function (Blueprint $table) {
            $table->dropColumn(['is_read', 'opened_at', 'track_token']);
        });
    }
};
