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

    protected static function booted()
    {
        static::creating(function ($company) {
            if (empty($company->api_key)) {
                $company->api_key = 'sk_test_' . \Illuminate\Support\Str::random(32);
            }
        });

        static::saved(function ($company) {
            // Clear tenant identification cache
            \Illuminate\Support\Facades\Cache::forget('company_subdomain_' . $company->subdomain);
            \Illuminate\Support\Facades\Cache::forget('company_details_' . $company->id);
            if ($company->domain) {
                // Since domain identification uses md5 of candidates, we might need a more general purge 
                // but for now, we clear common keys if they change
                \Illuminate\Support\Facades\Cache::flush(); // Safe way for companies
            }
        });

        static::deleted(function ($company) {
            \Illuminate\Support\Facades\Cache::forget('company_subdomain_' . $company->subdomain);
            \Illuminate\Support\Facades\Cache::flush();
        });
    }

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
        'website',
        'logo',
        'favicon',
        'status',
        'api_key',
        'subscription_plan_id',
        'subscription_start_date',
        'subscription_end_date',
        'notes',
        'whatsapp_phone_number',
        'whatsapp_api_key',
        'whatsapp_phone_number_id',
        'whatsapp_webhook_secret',
        'whatsapp_verify_token',
        'whatsapp_enabled',
        'whatsapp_status',
        'whatsapp_last_sync',
        'whatsapp_business_account_id',
        'whatsapp_waba_id',
        'whatsapp_display_name',
        'auto_provision_whatsapp',
        'whatsapp_settings',
        'google_client_id',
        'google_client_secret',
        'google_redirect_uri',
        'google_enabled',
        'google_status',
        'dns_status',
        'dns_verification_token',
        'telephony_provider',
        'telephony_enabled',
        'telephony_status',
        'exotel_account_sid',
        'exotel_api_key',
        'exotel_api_token',
        'exotel_subdomain',
        'exotel_from_number',
        'exotel_webhook_secret',
        'fb_page_id',
        'fb_page_access_token',
        'fb_ad_account_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $appends = ['crm_url'];

    protected $casts = [
        'subscription_start_date' => 'date',
        'subscription_end_date' => 'date',
        'whatsapp_enabled' => 'boolean',
        'auto_provision_whatsapp' => 'boolean',
        'whatsapp_last_sync' => 'datetime',
        'whatsapp_settings' => 'array',
        'google_enabled' => 'boolean',
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
        $endDate = \Illuminate\Support\Carbon::parse($this->subscription_end_date);
        return $endDate->isPast();
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
        $endDate = \Illuminate\Support\Carbon::parse($this->subscription_end_date);
        return $endDate->isFuture() &&
            $endDate->diffInDays(now()) <= 7;
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
     * Get CRM URL for the company.
     * Domain can be full host (crm.gashwatechnologies.com) or base (gashwatechnologies.com).
     *
     * @return string
     */
    public function getCrmUrlAttribute(): string
    {
        if ($this->domain) {
            $domain = trim($this->domain);
            $parts = explode('.', $domain);
            // Full host like crm.gashwatechnologies.com (3+ parts) -> use as-is
            if (count($parts) > 2) {
                return 'https://' . $domain;
            }
            // Base domain like gashwatechnologies.com -> crm.gashwatechnologies.com
            return 'https://crm.' . $domain;
        }
        // For localhost or default domain (subdomain only)
        return 'https://c.' . $this->subdomain . '.' . config('app.domain', 'localhost');
    }

    /**
     * Get logo with fallback to default.
     */
    public function getLogoAttribute($value)
    {
        if (empty($value)) {
            return '/assets/defaults/logo.jpg';
        }

        if (!filter_var($value, FILTER_VALIDATE_URL)) {
            // If it's already an asset path, return it as-is (with leading slash)
            if (str_starts_with($value, 'assets/')) {
                return '/' . $value;
            }
            return asset('storage/' . $value);
        }

        return $value;
    }

    /**
     * Get favicon with fallback to default.
     */
    public function getFaviconAttribute($value)
    {
        if (empty($value)) {
            return '/assets/defaults/fav.jpg';
        }

        if (!filter_var($value, FILTER_VALIDATE_URL)) {
            // If it's already an asset path, return it as-is (with leading slash)
            if (str_starts_with($value, 'assets/')) {
                return '/' . $value;
            }
            return asset('storage/' . $value);
        }

        return $value;
    }

    /**
     * Get company name with fallback to default.
     */
    public function getNameAttribute($value)
    {
        if (empty($value)) {
            return config('app.name', 'Your Company Name');
        }
        return $value;
    }
}

