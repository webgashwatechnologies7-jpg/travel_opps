<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            // New DNS Status Flow
            if (!Schema::hasColumn('companies', 'dns_status')) {
                $table->enum('dns_status', ['pending', 'verifying', 'active', 'suspended'])
                    ->default('active') // Important: Keep old users active
                    ->after('status');
            }
            if (!Schema::hasColumn('companies', 'dns_verification_token')) {
                $table->string('dns_verification_token')->nullable()->after('dns_status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn(['dns_status', 'dns_verification_token']);
        });
    }
};
