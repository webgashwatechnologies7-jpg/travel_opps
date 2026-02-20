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
        // This includes Managers, Team Leaders, and Employees.
        // Employees have no subordinates, so they only see their own.
        $subordinateIds = $user->getAllSubordinateIds();

        if (count($subordinateIds) > 1) {
            // User has a team (Manager/TL) - Show Team's Data
            $builder->whereIn($this->column, $subordinateIds);
        } else {
            // User is alone (Employee/Agent) - Show Only Self Data
            $builder->where($this->column, $user->id);
        }
    }
}
