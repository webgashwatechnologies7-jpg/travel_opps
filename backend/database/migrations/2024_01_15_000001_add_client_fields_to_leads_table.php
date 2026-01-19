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
            // Add new columns if they don't exist
            if (!Schema::hasColumn('leads', 'client_title')) {
                $table->string('client_title')->nullable()->after('client_name');
            }
            if (!Schema::hasColumn('leads', 'email_secondary')) {
                $table->string('email_secondary')->nullable()->after('email');
            }
            if (!Schema::hasColumn('leads', 'phone_secondary')) {
                $table->string('phone_secondary')->nullable()->after('phone');
            }
            if (!Schema::hasColumn('leads', 'address')) {
                $table->text('address')->nullable()->after('destination');
            }
            if (!Schema::hasColumn('leads', 'date_of_birth')) {
                $table->date('date_of_birth')->nullable()->after('address');
            }
            if (!Schema::hasColumn('leads', 'marriage_anniversary')) {
                $table->date('marriage_anniversary')->nullable()->after('date_of_birth');
            }
            if (!Schema::hasColumn('leads', 'client_type')) {
                $table->string('client_type')->default('individual')->after('marriage_anniversary');
            }
            if (!Schema::hasColumn('leads', 'company_id')) {
                $table->foreignId('company_id')->nullable()->constrained()->onDelete('cascade');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn([
                'client_title',
                'email_secondary', 
                'phone_secondary',
                'address',
                'date_of_birth',
                'marriage_anniversary',
                'client_type'
            ]);
        });
    }
};
