<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait HasCompany
{
    /**
     * Boot the trait.
     */
    protected static function bootHasCompany()
    {
        // Automatically add company_id when creating
        static::creating(function ($model) {
            if (!$model->company_id && tenant('id')) {
                $model->company_id = tenant('id');
            }
        });

        // Add global scope to filter by company
        static::addGlobalScope('company', function (Builder $builder) {
            $companyId = tenant('id');
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
        $companyId = $companyId ?? tenant('id');
        return $query->where('company_id', $companyId);
    }
}

