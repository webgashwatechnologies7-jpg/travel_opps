<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class QueryProposal extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'title',
        'description',
        'total_amount',
        'currency',
        'status',
        'valid_until',
        'is_confirmed',
        'sent_at',
        'terms_conditions',
        'notes',
        'metadata',
        'created_by'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'valid_until' => 'date',
        'is_confirmed' => 'boolean',
        'sent_at' => 'datetime',
        'metadata' => 'array'
    ];

    /**
     * Get the lead that owns the proposal
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * Get the user who created the proposal
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the proposal items
     */
    public function items(): HasMany
    {
        return $this->hasMany(ProposalItem::class, 'proposal_id');
    }

    /**
     * Get the proposal attachments
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(ProposalAttachment::class, 'proposal_id');
    }

    /**
     * Scope for confirmed proposals
     */
    public function scopeConfirmed($query)
    {
        return $query->where('is_confirmed', true);
    }

    /**
     * Scope for proposals by status
     */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}