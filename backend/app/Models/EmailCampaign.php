<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Modules\Leads\Domain\Entities\Lead;

class EmailCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'subject',
        'template_id',
        'lead_ids',
        'total_leads',
        'scheduled_at',
        'sent_at',
        'status',
        'sent_count',
        'failed_count',
        'delivered_count',
        'open_count',
        'click_count',
        'bounce_count',
        'unsubscribe_count',
        'created_by',
    ];

    protected $casts = [
        'lead_ids' => 'array',
        'total_leads' => 'integer',
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'sent_count' => 'integer',
        'failed_count' => 'integer',
        'delivered_count' => 'integer',
        'open_count' => 'integer',
        'click_count' => 'integer',
        'bounce_count' => 'integer',
        'unsubscribe_count' => 'integer',
    ];

    /**
     * Get the template for the campaign.
     */
    public function template(): BelongsTo
    {
        return $this->belongsTo(MarketingTemplate::class);
    }

    /**
     * Get the leads for the campaign.
     */
    public function leads(): BelongsToMany
    {
        return $this->belongsToMany(Lead::class, 'campaign_leads');
    }

    /**
     * Get the creator of the campaign.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Calculate open rate.
     */
    public function getOpenRateAttribute(): float
    {
        if ($this->delivered_count == 0) {
            return 0;
        }

        return round(($this->open_count / $this->delivered_count) * 100, 2);
    }

    /**
     * Calculate click rate.
     */
    public function getClickRateAttribute(): float
    {
        if ($this->delivered_count == 0) {
            return 0;
        }

        return round(($this->click_count / $this->delivered_count) * 100, 2);
    }

    /**
     * Calculate bounce rate.
     */
    public function getBounceRateAttribute(): float
    {
        if ($this->sent_count == 0) {
            return 0;
        }

        return round(($this->bounce_count / $this->sent_count) * 100, 2);
    }

    /**
     * Scope to get active campaigns.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope to get sent campaigns.
     */
    public function scopeSent($query)
    {
        return $query->where('status', 'sent');
    }

    /**
     * Scope to get scheduled campaigns.
     */
    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled');
    }
}
