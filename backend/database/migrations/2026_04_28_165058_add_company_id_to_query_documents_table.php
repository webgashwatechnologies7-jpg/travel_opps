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
        Schema::table('query_documents', function (Blueprint $table) {
            if (!Schema::hasColumn('query_documents', 'company_id')) {
                $table->unsignedBigInteger('company_id')->nullable()->after('id');
                $table->index('company_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('query_documents', function (Blueprint $table) {
            $table->dropColumn('company_id');
        });
    }
};
