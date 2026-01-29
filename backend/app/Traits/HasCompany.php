<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait HasCompany
{
    private static function resolveTenantId(): ?int
    {
        if (!app()->bound('tenant')) {
            return null;
        }

        $tenant = app('tenant');
        if (is_object($tenant) && isset($tenant->id)) {
            return (int) $tenant->id;
        }

        return null;
    }

    /**
     * Boot the trait.
     */
    protected static function bootHasCompany()
    {
        // Automatically add company_id when creating
        static::creating(function ($model) {
            $tenantId = self::resolveTenantId();
            if (!$model->company_id && $tenantId) {
                $model->company_id = $tenantId;
            }
        });

        // Add global scope to filter by company
        static::addGlobalScope('company', function (Builder $builder) {
            $companyId = self::resolveTenantId();
            if ($companyId && !auth()->user()?->isSuperAdmin()) {
                $builder->where('company_id', $companyId);
            }
        });
    }

    /**
     * Scope a query to only include records for the current company.
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeForCompany($query, $companyId = null)
    {
        $companyId = $companyId ?? self::resolveTenantId();
        return $query->where('company_id', $companyId);
    }
}

