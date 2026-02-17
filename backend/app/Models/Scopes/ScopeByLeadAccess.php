<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class ScopeByLeadAccess implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // Simply filter by leads that the user has access to.
        // The Lead model itself must have the ScopeByHierarchy (or similar) applied globally
        // for this to work effectively.
        $builder->whereHas('lead');
    }
}
