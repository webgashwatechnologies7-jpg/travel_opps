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
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('city')->nullable();
            $table->string('company_name');
            $table->enum('title', ['Mr.', 'Mrs.', 'Ms.', 'Dr.'])->default('Mr.');
            $table->string('first_name');
            $table->string('last_name')->nullable();
            $table->string('email')->nullable();
            $table->string('phone_code', 10)->default('+91');
            $table->string('mobile', 20)->nullable();
            $table->text('address')->nullable();
            $table->timestamps();

            // Add indexes for fast search
            $table->index('company_name', 'suppliers_company_name_index');
            $table->index('email', 'suppliers_email_index');
            $table->index('mobile', 'suppliers_mobile_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
