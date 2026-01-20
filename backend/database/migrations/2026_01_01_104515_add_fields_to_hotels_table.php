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
        if (Schema::hasTable('hotels')) {
            Schema::table('hotels', function (Blueprint $table) {

                if (!Schema::hasColumn('hotels', 'hotel_details')) {
                    $table->text('hotel_details')->nullable()->after('destination');
                }

                if (!Schema::hasColumn('hotels', 'hotel_photo')) {
                    $table->string('hotel_photo')->nullable()->after('hotel_details');
                }

                if (!Schema::hasColumn('hotels', 'contact_person')) {
                    $table->string('contact_person')->nullable()->after('hotel_photo');
                }

                if (!Schema::hasColumn('hotels', 'email')) {
                    $table->string('email')->nullable()->after('contact_person');
                }

                if (!Schema::hasColumn('hotels', 'phone')) {
                    $table->string('phone')->nullable()->after('email');
                }

                if (!Schema::hasColumn('hotels', 'hotel_address')) {
                    $table->text('hotel_address')->nullable()->after('phone');
                }

                if (!Schema::hasColumn('hotels', 'hotel_link')) {
                    $table->string('hotel_link')->nullable()->after('hotel_address');
                }

                if (Schema::hasColumn('hotels', 'category')) {
                    $table->integer('category')->nullable()->change();
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('hotels')) {
            Schema::table('hotels', function (Blueprint $table) {

                $columns = [
                    'hotel_details',
                    'hotel_photo',
                    'contact_person',
                    'email',
                    'phone',
                    'hotel_address',
                    'hotel_link',
                ];

                foreach ($columns as $column) {
                    if (Schema::hasColumn('hotels', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
