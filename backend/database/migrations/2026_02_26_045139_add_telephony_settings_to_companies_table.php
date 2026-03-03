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
            $table->string('telephony_provider', 30)->nullable()->after('whatsapp_settings');

            // Exotel Settings
            $table->string('exotel_account_sid')->nullable()->after('telephony_provider');
            $table->string('exotel_api_key')->nullable()->after('exotel_account_sid');
            $table->string('exotel_api_token')->nullable()->after('exotel_api_key');
            $table->string('exotel_subdomain')->default('api.exotel.com')->nullable()->after('exotel_api_token');
            $table->string('exotel_from_number')->nullable()->after('exotel_subdomain');
            $table->string('exotel_webhook_secret')->nullable()->after('exotel_from_number');

            // General Telephony status
            $table->boolean('telephony_enabled')->default(false)->after('exotel_webhook_secret');
            $table->string('telephony_status')->default('not_configured')->after('telephony_enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('companies', function (Blueprint $table) {
            $table->dropColumn([
                'telephony_provider',
                'exotel_account_sid',
                'exotel_api_key',
                'exotel_api_token',
                'exotel_subdomain',
                'exotel_from_number',
                'exotel_webhook_secret',
                'telephony_enabled',
                'telephony_status'
            ]);
        });
    }
};
