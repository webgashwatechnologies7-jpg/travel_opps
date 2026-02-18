<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Modules\Leads\Domain\Entities\Lead;

class WhatsAppCampaign extends Model
{
    use HasFactory;

    protected $table = 'whatsapp_campaigns';

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
        'company_id',
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
        return $this->belongsToMany(Lead::class, 'campaign_leads', 'whatsapp_campaign_id', 'lead_id');
    }

    /**
     * Get the creator of the campaign.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the company that owns the campaign.
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
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
