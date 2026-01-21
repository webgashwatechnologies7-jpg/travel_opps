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
        Schema::table('companies', function (Blueprint $table) {
            $table->string('google_client_id')->nullable();
            $table->string('google_client_secret')->nullable();
            $table->string('google_redirect_uri')->nullable();
            $table->boolean('google_enabled')->default(false);
            $table->enum('google_status', ['not_configured', 'active', 'error'])->default('not_configured');

            $table->index('google_enabled');
            $table->index('google_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'google_client_id',
                'google_client_secret',
                'google_redirect_uri',
                'google_enabled',
                'google_status',
            ]);
        });
    }
};
