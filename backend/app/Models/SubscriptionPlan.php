<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\SubscriptionPlanFeature;
use App\Models\SubscriptionFeature;

class SubscriptionPlan extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Get the dynamic features for this subscription plan.
     */
    public function planFeatures(): BelongsToMany
    {
        return $this->belongsToMany(SubscriptionFeature::class, 'plan_features', 'subscription_plan_id', 'subscription_feature_id')
            ->withPivot('is_active', 'limit_value')
            ->withTimestamps();
    }

    /**
     * Check if plan has a specific dynamic feature enabled.
     */
    public function hasDynamicFeature(string $featureKey): bool
    {
        return $this->planFeatures()
            ->where('key', $featureKey)
            ->wherePivot('is_active', true)
            ->exists();
    }

    protected $fillable = [
        'name',
        'slug',
        'description',
        'price',
        'billing_period',
        'max_users',
        'max_leads',
        'features',
        'permissions', // JSON array of feature IDs
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'features' => 'array',
        'permissions' => 'array', // Cast to array for easy access
        'is_active' => 'boolean',
        'max_users' => 'integer',
        'max_leads' => 'integer',
    ];

    /**
     * Get the companies for this subscription plan.
     */
    public function companies(): HasMany
    {
        return $this->hasMany(Company::class);
    }

    /**
     * Get the features for this subscription plan.
     */
    public function subscriptionFeatures(): HasMany
    {
        return $this->hasMany(SubscriptionPlanFeature::class);
    }

    /**
     * Check if plan has a specific feature enabled.
     */
    public function hasFeature(string $featureKey): bool
    {
        return $this->subscriptionFeatures()
            ->where('feature_key', $featureKey)
            ->where('is_enabled', true)
            ->exists();
    }

    /**
     * Get feature limit value.
     */
    public function getFeatureLimit(string $featureKey): ?int
    {
        $feature = $this->subscriptionFeatures()
            ->where('feature_key', $featureKey)
            ->where('is_enabled', true)
            ->first();

        return $feature ? $feature->limit_value : null;
    }

    /**
     * Check if plan has unlimited users.
     */
    public function hasUnlimitedUsers(): bool
    {
        return $this->max_users === null;
    }

    /**
     * Check if plan has unlimited leads.
     */
    public function hasUnlimitedLeads(): bool
    {
        return $this->max_leads === null;
    }

    /**
     * Get enabled feature IDs from permissions column.
     */
    public function getEnabledFeatureIds(): array
    {
        return $this->permissions ?? [];
    }

    /**
     * Check if plan has a feature by feature ID (from permissions column).
     */
    public function hasFeatureById(int $featureId): bool
    {
        $permissions = $this->getEnabledFeatureIds();
        return in_array($featureId, $permissions);
    }

    /**
     * Get enabled features using permissions column.
     */
    public function getEnabledFeaturesFromPermissions()
    {
        $featureIds = $this->getEnabledFeatureIds();
        if (empty($featureIds)) {
            return collect();
        }

        return SubscriptionPlanFeature::whereIn('id', $featureIds)
            ->where('subscription_plan_id', $this->id)
            ->where('is_enabled', true)
            ->get();
    }
}

