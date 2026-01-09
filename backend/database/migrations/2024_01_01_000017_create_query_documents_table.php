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
        Schema::create('query_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('lead_id')->constrained('leads')->onDelete('cascade');
            $table->enum('document_type', [
                'passport', 'visa', 'id_card', 'driving_license', 
                'insurance', 'ticket', 'voucher', 'contract', 
                'invoice', 'receipt', 'other'
            ])->default('other');
            $table->enum('document_category', [
                'travel_document', 'identification', 'booking_document', 
                'financial_document', 'legal_document', 'other'
            ])->default('other');
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type', 10)->nullable(); // pdf, jpg, png, etc.
            $table->bigInteger('file_size')->nullable(); // in bytes
            $table->boolean('is_verified')->default(false);
            $table->boolean('is_required')->default(false);
            $table->date('expiry_date')->nullable();
            $table->enum('status', ['pending', 'verified', 'rejected', 'expired'])->default('pending');
            $table->text('rejection_reason')->nullable();
            $table->json('tags')->nullable(); // For document tags/labels
            $table->enum('access_level', ['private', 'internal', 'public'])->default('private');
            $table->json('metadata')->nullable(); // For storing additional document data
            $table->foreignId('uploaded_by')->constrained('users')->onDelete('cascade');
            $table->foreignId('verified_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('verified_at')->nullable();
            $table->timestamps();

            $table->index(['lead_id', 'document_type']);
            $table->index(['uploaded_by']);
            $table->index(['status']);
            $table->index(['is_verified']);
            $table->index(['expiry_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('query_documents');
    }
};