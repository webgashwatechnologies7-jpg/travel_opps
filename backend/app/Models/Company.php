<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Company extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'subdomain',
        'domain',
        'email',
        'phone',
        'address',
        'logo',
        'status',
        'subscription_plan_id',
        'subscription_start_date',
        'subscription_end_date',
        'notes',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'subscription_start_date' => 'date',
        'subscription_end_date' => 'date',
    ];

    /**
     * Get the users for the company.
     *
     * @return HasMany
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * Get the company settings for the company.
     *
     * @return HasMany
     */
    public function settings(): HasMany
    {
        return $this->hasMany(CompanySettings::class);
    }

    /**
     * Get the subscription plan for the company.
     *
     * @return BelongsTo
     */
    public function subscriptionPlan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    /**
     * Check if subscription is expired.
     *
     * @return bool
     */
    public function isSubscriptionExpired(): bool
    {
        if (!$this->subscription_end_date) {
            return false;
        }
        return $this->subscription_end_date->isPast();
    }

    /**
     * Check if subscription is expiring soon (within 7 days).
     *
     * @return bool
     */
    public function isSubscriptionExpiringSoon(): bool
    {
        if (!$this->subscription_end_date) {
            return false;
        }
        return $this->subscription_end_date->isFuture() && 
               $this->subscription_end_date->diffInDays(now()) <= 7;
    }

    /**
     * Check if company has access to a specific feature.
     *
     * @param string $featureKey
     * @return bool
     */
    public function hasFeature(string $featureKey): bool
    {
        // Super admin companies have all features
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Check if subscription is active
        if ($this->isSubscriptionExpired() || $this->status !== 'active') {
            return false;
        }

        // Check if plan has the feature
        if (!$this->subscriptionPlan) {
            return false;
        }

        return $this->subscriptionPlan->hasFeature($featureKey);
    }

    /**
     * Get feature limit for company.
     *
     * @param string $featureKey
     * @return int|null
     */
    public function getFeatureLimit(string $featureKey): ?int
    {
        if (!$this->subscriptionPlan) {
            return null;
        }

        return $this->subscriptionPlan->getFeatureLimit($featureKey);
    }

    /**
     * Check if company is super admin (for backward compatibility).
     */
    private function isSuperAdmin(): bool
    {
        return false; // Companies are never super admin
    }

    /**
     * Check if company is active.
     *
     * @return bool
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Get full URL for the company.
     *
     * @return string
     */
    public function getFullUrlAttribute(): string
    {
        if ($this->domain) {
            return 'https://' . $this->domain;
        }
        return 'https://' . $this->subdomain . '.' . config('app.domain', 'localhost');
    }

    /**
     * Get CRM URL for the company (with c. prefix).
     *
     * @return string
     */
    public function getCrmUrlAttribute(): string
    {
        if ($this->domain) {
            // If domain is gashwa.com, return c.gashwa.com
            return 'https://c.' . $this->domain;
        }
        // For localhost or default domain
        return 'https://c.' . $this->subdomain . '.' . config('app.domain', 'localhost');
    }
}

