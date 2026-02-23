<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Add performance indexes to high-traffic tables.
     * Uses DB-level existence check to safely skip already-existing indexes.
     */
    public function up(): void
    {
        $dbName = DB::connection()->getDatabaseName();

        // ─── Hotels ──────────────────────────────────────────────────────────────
        if (Schema::hasTable('hotels')) {
            Schema::table('hotels', function (Blueprint $table) use ($dbName) {
                if (!$this->indexExists($dbName, 'hotels', 'hotels_company_status_idx'))
                    $table->index(['company_id', 'status'], 'hotels_company_status_idx');
                if (!$this->indexExists($dbName, 'hotels', 'hotels_company_dest_idx'))
                    $table->index(['company_id', 'destination'], 'hotels_company_dest_idx');
                if (!$this->indexExists($dbName, 'hotels', 'hotels_updated_at_idx'))
                    $table->index(['updated_at'], 'hotels_updated_at_idx');
            });
        }

        // ─── Activities ───────────────────────────────────────────────────────────
        if (Schema::hasTable('activities')) {
            Schema::table('activities', function (Blueprint $table) use ($dbName) {
                if (!$this->indexExists($dbName, 'activities', 'activities_company_status_idx'))
                    $table->index(['company_id', 'status'], 'activities_company_status_idx');
                if (!$this->indexExists($dbName, 'activities', 'activities_company_dest_idx'))
                    $table->index(['company_id', 'destination'], 'activities_company_dest_idx');
                if (!$this->indexExists($dbName, 'activities', 'activities_updated_at_idx'))
                    $table->index(['updated_at'], 'activities_updated_at_idx');
            });
        }

        // ─── Lead Followups ───────────────────────────────────────────────────────
        if (Schema::hasTable('lead_followups')) {
            Schema::table('lead_followups', function (Blueprint $table) use ($dbName) {
                if (!$this->indexExists($dbName, 'lead_followups', 'followups_lead_created_idx'))
                    $table->index(['lead_id', 'created_at'], 'followups_lead_created_idx');
                if (!$this->indexExists($dbName, 'lead_followups', 'followups_user_id_idx'))
                    $table->index(['user_id'], 'followups_user_id_idx');
                if (!$this->indexExists($dbName, 'lead_followups', 'followups_reminder_date_idx'))
                    $table->index(['reminder_date'], 'followups_reminder_date_idx');
            });
        }

        // ─── Payments ─────────────────────────────────────────────────────────────
        if (Schema::hasTable('payments')) {
            Schema::table('payments', function (Blueprint $table) use ($dbName) {
                if (!$this->indexExists($dbName, 'payments', 'payments_lead_id_idx'))
                    $table->index(['lead_id'], 'payments_lead_id_idx');
                if (!$this->indexExists($dbName, 'payments', 'payments_company_status_idx'))
                    $table->index(['company_id', 'status'], 'payments_company_status_idx');
                if (!$this->indexExists($dbName, 'payments', 'payments_due_date_idx') && Schema::hasColumn('payments', 'due_date'))
                    $table->index(['due_date'], 'payments_due_date_idx');
            });
        }

        // ─── Proposals ────────────────────────────────────────────────────────────
        if (Schema::hasTable('proposals')) {
            Schema::table('proposals', function (Blueprint $table) use ($dbName) {
                if (!$this->indexExists($dbName, 'proposals', 'proposals_lead_created_idx'))
                    $table->index(['lead_id', 'created_at'], 'proposals_lead_created_idx');
                if (!$this->indexExists($dbName, 'proposals', 'proposals_company_id_idx') && Schema::hasColumn('proposals', 'company_id'))
                    $table->index(['company_id'], 'proposals_company_id_idx');
            });
        }

        // ─── Quotations ───────────────────────────────────────────────────────────
        if (Schema::hasTable('quotations')) {
            Schema::table('quotations', function (Blueprint $table) use ($dbName) {
                if (!$this->indexExists($dbName, 'quotations', 'quotations_lead_created_idx'))
                    $table->index(['lead_id', 'created_at'], 'quotations_lead_created_idx');
                if (!$this->indexExists($dbName, 'quotations', 'quotations_company_created_idx') && Schema::hasColumn('quotations', 'company_id'))
                    $table->index(['company_id', 'created_at'], 'quotations_company_created_idx');
            });
        }

        // ─── Currencies ───────────────────────────────────────────────────────────
        if (Schema::hasTable('currencies')) {
            Schema::table('currencies', function (Blueprint $table) use ($dbName) {
                if (!$this->indexExists($dbName, 'currencies', 'currencies_is_primary_idx'))
                    $table->index(['is_primary'], 'currencies_is_primary_idx');
                if (!$this->indexExists($dbName, 'currencies', 'currencies_status_idx'))
                    $table->index(['status'], 'currencies_status_idx');
            });
        }

        // ─── Packages / Itineraries ───────────────────────────────────────────────
        if (Schema::hasTable('packages')) {
            Schema::table('packages', function (Blueprint $table) use ($dbName) {
                if (!$this->indexExists($dbName, 'packages', 'packages_company_updated_idx') && Schema::hasColumn('packages', 'company_id'))
                    $table->index(['company_id', 'updated_at'], 'packages_company_updated_idx');
            });
        }

        // ─── Day Itineraries ──────────────────────────────────────────────────────
        if (Schema::hasTable('day_itineraries')) {
            Schema::table('day_itineraries', function (Blueprint $table) use ($dbName) {
                if (!$this->indexExists($dbName, 'day_itineraries', 'day_itin_company_updated_idx') && Schema::hasColumn('day_itineraries', 'company_id'))
                    $table->index(['company_id', 'updated_at'], 'day_itin_company_updated_idx');
            });
        }
    }

    /**
     * Check if an index exists in the database.
     */
    private function indexExists(string $dbName, string $tableName, string $indexName): bool
    {
        $result = DB::select("
            SELECT COUNT(*) as cnt
            FROM information_schema.statistics
            WHERE table_schema = ? AND table_name = ? AND index_name = ?
        ", [$dbName, $tableName, $indexName]);

        return ($result[0]->cnt ?? 0) > 0;
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $drops = [
            'hotels' => ['hotels_company_status_idx', 'hotels_company_dest_idx', 'hotels_updated_at_idx'],
            'activities' => ['activities_company_status_idx', 'activities_company_dest_idx', 'activities_updated_at_idx'],
            'lead_followups' => ['followups_lead_created_idx', 'followups_user_id_idx', 'followups_reminder_date_idx'],
            'payments' => ['payments_lead_id_idx', 'payments_company_status_idx', 'payments_due_date_idx'],
            'proposals' => ['proposals_lead_created_idx', 'proposals_company_id_idx'],
            'quotations' => ['quotations_lead_created_idx', 'quotations_company_created_idx'],
            'currencies' => ['currencies_is_primary_idx', 'currencies_status_idx'],
            'packages' => ['packages_company_status_idx', 'packages_company_updated_idx'],
            'day_itineraries' => ['day_itin_company_updated_idx'],
        ];

        foreach ($drops as $tableName => $indexes) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($indexes) {
                    foreach ($indexes as $index) {
                        try {
                            $table->dropIndex($index);
                        } catch (\Exception $e) {
                            // Ignore if index doesn't exist
                        }
                    }
                });
            }
        }
    }
};
