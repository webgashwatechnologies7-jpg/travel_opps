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
        Schema::create('call_spam_list', function (Blueprint $blueprint) {
            $blueprint->id();
            $blueprint->unsignedBigInteger('company_id')->nullable();
            $blueprint->string('phone_number');
            $blueprint->string('phone_number_normalized');
            $blueprint->string('reason')->nullable();
            $blueprint->unsignedBigInteger('added_by')->nullable();
            $blueprint->timestamps();

            $blueprint->index(['phone_number_normalized', 'company_id']);
            $blueprint->foreign('company_id')->references('id')->on('companies')->onDelete('cascade');
            $blueprint->foreign('added_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('call_spam_list');
    }
};
