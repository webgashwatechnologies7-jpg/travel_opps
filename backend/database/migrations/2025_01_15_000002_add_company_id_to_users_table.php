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

            // Add company_id foreign key
            $table->foreignId('company_id')
                ->nullable()
                ->after('id')
                ->constrained('companies')
                ->onDelete('cascade');

            // Add super admin flag
            $table->boolean('is_super_admin')
                ->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {

            // Drop foreign key & column
            $table->dropForeign(['company_id']);
            $table->dropColumn('company_id');

            // Drop is_super_admin column
            $table->dropColumn('is_super_admin');
        });
    }
};
