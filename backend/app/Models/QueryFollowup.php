<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Scopes\ScopeByHierarchy;
use App\Modules\Leads\Domain\Entities\Lead;

class QueryFollowup extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'followup_type',
        'title',
        'description',
        'remark',
        'reminder_date',
        'reminder_time',
        'priority',
        'status',
        'is_completed',
        'completed_at',
        'completion_notes',
        'metadata',
        'assigned_to',
        'created_by'
    ];

    protected $casts = [
        'reminder_date' => 'date',
        'reminder_time' => 'datetime',
        'is_completed' => 'boolean',
        'completed_at' => 'datetime',
        'metadata' => 'array'
    ];

    /**
     * Get the lead that owns the followup
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * Get the user assigned to the followup
     */
    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    /**
     * Get the user who created the followup
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope for pending followups
     */
    public function scopePending($query)
    {
        return $query->where('is_completed', false);
    }

    /**
     * Scope for completed followups
     */
    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    /**
     * Scope for overdue followups
     */
    public function scopeOverdue($query)
    {
        return $query->where('reminder_date', '<', now()->toDateString())
            ->where('is_completed', false);
    }

    /**
     * Scope for today's followups
     */
    public function scopeToday($query)
    {
        return $query->whereDate('reminder_date', now()->toDateString());
    }

    /**
     * Scope by priority
     */
    public function scopeByPriority($query, $priority)
    {
        return $query->where('priority', $priority);
    }
    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new ScopeByHierarchy);
    }
}