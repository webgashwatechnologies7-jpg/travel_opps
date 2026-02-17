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
        // (Company ID filtering is usually handled by a separate TenantScope, 
        //  but here we just ensure we don't restrict by 'assigned_to')
        if ($user->hasRole('Company Admin') || $user->hasRole('Admin')) {
            return;
        }

        // 3. Manager Restriction: ONLY see leads assigned to self or created by self
        if ($user->hasRole('Manager')) {
            $builder->where(function ($q) use ($user) {
                $q->where('assigned_to', $user->id)
                    ->orWhere('created_by', $user->id);
            });
            return;
        }

        // 4. Hierarchy Logic (TLs, Agents)
        // Get all subordinates + self
        $subordinateIds = $user->getAllSubordinateIds();

        if (count($subordinateIds) > 1) {
            // User has a team (TL) - Show Team's Data
            $builder->whereIn($this->column, $subordinateIds);
        } else {
            // User is alone (Agent) - Show Only Self Data
            $builder->where($this->column, $user->id);
        }
    }
}
