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
        Schema::table('hotels', function (Blueprint $table) {
            $table->text('hotel_details')->nullable()->after('destination');
            $table->string('hotel_photo')->nullable()->after('hotel_details');
            $table->string('contact_person')->nullable()->after('hotel_photo');
            $table->string('email')->nullable()->after('contact_person');
            $table->string('phone')->nullable()->after('email');
            $table->text('hotel_address')->nullable()->after('phone');
            $table->string('hotel_link')->nullable()->after('hotel_address');
            $table->integer('category')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn([
                'hotel_details',
                'hotel_photo',
                'contact_person',
                'email',
                'phone',
                'hotel_address',
                'hotel_link'
            ]);
        });
    }
};
