<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeePerformanceLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'date',
        'leads_assigned',
        'leads_confirmed',
        'leads_cancelled',
        'revenue_generated',
        'target_amount',
        'achievement_amount',
    ];

    protected $casts = [
        'date' => 'date',
        'leads_assigned' => 'integer',
        'leads_confirmed' => 'integer',
        'leads_cancelled' => 'integer',
        'revenue_generated' => 'decimal:2',
        'target_amount' => 'decimal:2',
        'achievement_amount' => 'decimal:2',
    ];

    /**
     * Get the user that owns the performance log.
     *
     * @return BelongsTo
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Calculate success rate for this log entry.
     *
     * @return float
     */
    public function getSuccessRateAttribute(): float
    {
        if ($this->leads_assigned === 0) {
            return 0;
        }

        return round(($this->leads_confirmed / $this->leads_assigned) * 100, 2);
    }

    /**
     * Calculate cancellation rate for this log entry.
     *
     * @return float
     */
    public function getCancellationRateAttribute(): float
    {
        if ($this->leads_assigned === 0) {
            return 0;
        }

        return round(($this->leads_cancelled / $this->leads_assigned) * 100, 2);
    }

    /**
     * Calculate achievement percentage for this log entry.
     *
     * @return float
     */
    public function getAchievementPercentageAttribute(): float
    {
        if ($this->target_amount == 0) {
            return 0;
        }

        return round(($this->achievement_amount / $this->target_amount) * 100, 2);
    }
}
