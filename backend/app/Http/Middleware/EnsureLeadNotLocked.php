<?php

namespace App\Http\Middleware;

use App\Modules\Leads\Domain\Entities\Lead;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLeadNotLocked
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        return $next($request);
    }

    /**
     * Check if a lead is locked for the given user.
     */
    private function isLocked(Lead $lead, $user): bool
    {
        if (!$user)
            return true;

        // Admins and Managers are never locked out
        if ($user->hasRole(['Admin', 'Company Admin', 'Super Admin', 'Manager'])) {
            return false;
        }

        // Check if lead is explicitly locked or status is confirmed/booked
        if ($lead->is_locked || $lead->status === 'confirmed') {
            // If lead is temporarily unlocked for edit, allow it
            if ($lead->is_unlocked_for_edit) {
                return false;
            }
            return true;
        }

        return false;
    }
}
