<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_group_lead', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_group_id')->constrained('client_groups')->onDelete('cascade');
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['client_group_id', 'lead_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_group_lead');
    }
};
