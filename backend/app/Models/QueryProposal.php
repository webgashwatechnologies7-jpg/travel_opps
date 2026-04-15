<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Traits\HasCompany;

class QueryProposal extends Model
{
    use HasFactory, HasCompany;

    protected $fillable = [
        'company_id',
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
        'created_by',
        // Version tracking fields
        'version_status',
        'version_number',
        'archived_at',
        'archived_by',
    ];

    protected $casts = [
        'total_amount'  => 'decimal:2',
        'valid_until'   => 'date',
        'is_confirmed'  => 'boolean',
        'sent_at'       => 'datetime',
        'metadata'      => 'array',
        'archived_at'   => 'datetime',
    ];

    /** Get the lead that owns the proposal */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /** Get the user who created the proposal */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /** Get the user who archived the proposal */
    public function archiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    /** Scope: only active (currently selected) proposals */
    public function scopeActive($query)
    {
        return $query->where('version_status', 'active');
    }

    /** Scope: only archived (historical) proposals */
    public function scopeArchived($query)
    {
        return $query->where('version_status', 'archived');
    }

    /** Scope for confirmed proposals */
    public function scopeConfirmed($query)
    {
        return $query->where('is_confirmed', true);
    }

    /** Scope for proposals by status */
    public function scopeByStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}