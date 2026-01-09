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
        // Add company_id to leads table
        if (Schema::hasTable('leads')) {
            Schema::table('leads', function (Blueprint $table) {
                if (!Schema::hasColumn('leads', 'company_id')) {
                    $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                    $table->index('company_id');
                }
            });
        }

        // Add company_id to packages table
        if (Schema::hasTable('packages')) {
            Schema::table('packages', function (Blueprint $table) {
                if (!Schema::hasColumn('packages', 'company_id')) {
                    $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                    $table->index('company_id');
                }
            });
        }

        // Add company_id to hotels table
        if (Schema::hasTable('hotels')) {
            Schema::table('hotels', function (Blueprint $table) {
                if (!Schema::hasColumn('hotels', 'company_id')) {
                    $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                    $table->index('company_id');
                }
            });
        }

        // Add company_id to suppliers table
        if (Schema::hasTable('suppliers')) {
            Schema::table('suppliers', function (Blueprint $table) {
                if (!Schema::hasColumn('suppliers', 'company_id')) {
                    $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                    $table->index('company_id');
                }
            });
        }

        // Add company_id to activities table
        if (Schema::hasTable('activities')) {
            Schema::table('activities', function (Blueprint $table) {
                if (!Schema::hasColumn('activities', 'company_id')) {
                    $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                    $table->index('company_id');
                }
            });
        }

        // Add company_id to transfers table
        if (Schema::hasTable('transfers')) {
            Schema::table('transfers', function (Blueprint $table) {
                if (!Schema::hasColumn('transfers', 'company_id')) {
                    $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                    $table->index('company_id');
                }
            });
        }

        // Add company_id to destinations table
        if (Schema::hasTable('destinations')) {
            Schema::table('destinations', function (Blueprint $table) {
                if (!Schema::hasColumn('destinations', 'company_id')) {
                    $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                    $table->index('company_id');
                }
            });
        }

        // Add company_id to expenses table
        if (Schema::hasTable('expenses')) {
            Schema::table('expenses', function (Blueprint $table) {
                if (!Schema::hasColumn('expenses', 'company_id')) {
                    $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                    $table->index('company_id');
                }
            });
        }

        // Add company_id to payments table
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) {
                if (!Schema::hasColumn('payments', 'company_id')) {
                    $table->foreignId('company_id')->nullable()->after('id')->constrained('companies')->onDelete('cascade');
                    $table->index('company_id');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['leads', 'packages', 'hotels', 'suppliers', 'activities', 'transfers', 'destinations', 'expenses', 'payments'];
        
        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'company_id')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropForeign(['company_id']);
                    $table->dropColumn('company_id');
                });
            }
        }
    }
};

