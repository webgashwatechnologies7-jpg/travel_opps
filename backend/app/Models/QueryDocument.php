<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class QueryDocument extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'document_type',
        'document_category',
        'title',
        'description',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'is_verified',
        'is_required',
        'expiry_date',
        'status',
        'rejection_reason',
        'tags',
        'access_level',
        'metadata',
        'uploaded_by',
        'verified_by',
        'verified_at'
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'is_required' => 'boolean',
        'expiry_date' => 'date',
        'tags' => 'array',
        'metadata' => 'array',
        'verified_at' => 'datetime'
    ];

    /**
     * Get the lead that owns the document
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * Get the user who uploaded the document
     */
    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * Get the user who verified the document
     */
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    /**
     * Scope for verified documents
     */
    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    /**
     * Scope for pending documents
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    /**
     * Scope for expired documents
     */
    public function scopeExpired($query)
    {
        return $query->where('expiry_date', '<', now()->toDateString())
                    ->whereNotNull('expiry_date');
    }

    /**
     * Scope for expiring soon documents
     */
    public function scopeExpiringSoon($query, $days = 30)
    {
        return $query->whereBetween('expiry_date', [
            now()->toDateString(),
            now()->addDays($days)->toDateString()
        ]);
    }

    /**
     * Scope by document type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('document_type', $type);
    }

    /**
     * Scope by access level
     */
    public function scopeByAccessLevel($query, $level)
    {
        return $query->where('access_level', $level);
    }

    /**
     * Get file size in human readable format
     */
    public function getFileSizeHumanAttribute()
    {
        if (!$this->file_size) return 'Unknown';
        
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, 2) . ' ' . $units[$i];
    }
}