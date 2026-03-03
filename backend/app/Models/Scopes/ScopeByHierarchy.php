<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class ScopeByHierarchy implements Scope
{
    protected string $column;

    public function __construct(string $column = 'assigned_to')
    {
        $this->column = $column;
    }

    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        $user = \Illuminate\Support\Facades\Auth::user();

        if (!$user) {
            return;
        }

        // 1. Super Admin sees everything
        if ($user->is_super_admin) {
            return;
        }

        // 2. Company Admin / Admin sees everything within their company
        // (Company ID filtering is handled by HasCompany trait / global scope)
        if ($user->hasRole(['Company Admin', 'Admin'])) {
            return;
        }

        // 3. Everyone else sees their own + subordinates' data
        // Managers and TLs should also see UNASSIGNED leads to distribute them
        $subordinateIds = $user->getAllSubordinateIds();

        $builder->where(function ($q) use ($subordinateIds, $user) {
            $q->whereIn($this->column, $subordinateIds);

            // If the user is a Manager or has subordinates, they should see "Unassigned" leads to distribute them
            if ($user->hasRole(['Manager', 'Team Leader']) || count($subordinateIds) > 1) {
                $q->orWhereNull($this->column);
            }
        });
    }
}
