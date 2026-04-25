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
        Schema::table('leads', function (Blueprint $table) {
            $table->boolean('is_locked')->default(false)->after('status');
            $table->boolean('is_unlocked_for_edit')->default(false)->after('is_locked');
            $table->boolean('unlock_requested')->default(false)->after('is_unlocked_for_edit');
            $table->text('unlock_request_reason')->nullable()->after('unlock_requested');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['is_locked', 'is_unlocked_for_edit', 'unlock_requested', 'unlock_request_reason']);
        });
    }
};
