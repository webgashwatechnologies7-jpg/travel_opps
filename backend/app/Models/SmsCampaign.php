<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Modules\Leads\Domain\Entities\Lead;

class SmsCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'template_id',
        'lead_ids',
        'scheduled_at',
        'sent_at',
        'status',
        'sent_count',
        'delivered_count',
        'read_count',
        'failed_count',
        'created_by',
    ];

    protected $casts = [
        'lead_ids' => 'array',
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
        'sent_count' => 'integer',
        'delivered_count' => 'integer',
        'read_count' => 'integer',
        'failed_count' => 'integer',
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
        return $this->belongsToMany(Lead::class, 'sms_campaign_leads');
    }

    /**
     * Get the creator of the campaign.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Calculate delivery rate.
     */
    public function getDeliveryRateAttribute(): float
    {
        if ($this->sent_count == 0) {
            return 0;
        }
        
        return round(($this->delivered_count / $this->sent_count) * 100, 2);
    }

    /**
     * Calculate read rate.
     */
    public function getReadRateAttribute(): float
    {
        if ($this->delivered_count == 0) {
            return 0;
        }
        
        return round(($this->read_count / $this->delivered_count) * 100, 2);
    }

    /**
     * Calculate failure rate.
     */
    public function getFailureRateAttribute(): float
    {
        if ($this->sent_count == 0) {
            return 0;
        }
        
        return round(($this->failed_count / $this->sent_count) * 100, 2);
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
