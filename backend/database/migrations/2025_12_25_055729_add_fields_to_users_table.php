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
            // Add phone column with unique constraint (automatically creates index for fast search)
            $table->string('phone', 20)->nullable()->unique()->after('email');
            
            // Add is_active column with default value
            $table->boolean('is_active')->default(true)->after('phone');
            
            // Add last_login_at timestamp column
            $table->timestamp('last_login_at')->nullable()->after('is_active');
            
            // Note: Both email and phone have indexes for fast search:
            // - email: already indexed via unique() constraint in create_users_table migration
            // - phone: automatically indexed via unique() constraint above
            // No additional indexes needed as unique constraints provide the indexes
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop unique constraint on phone (which also drops its index)
            $table->dropUnique(['phone']);
            
            // Drop columns
            $table->dropColumn(['phone', 'is_active', 'last_login_at']);
        });
    }
};
