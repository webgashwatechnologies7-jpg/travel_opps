<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landing_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('company_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('title');
            $table->string('url_slug');
            $table->unique(['company_id', 'url_slug']);
            $table->string('template')->default('lead-capture');
            $table->text('meta_description')->nullable();
            $table->longText('content')->nullable();
            $table->string('status')->default('draft'); // draft, published
            $table->unsignedInteger('views')->default(0);
            $table->unsignedInteger('conversions')->default(0);
            $table->decimal('conversion_rate', 5, 2)->default(0);
            $table->timestamp('published_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landing_pages');
    }
};
