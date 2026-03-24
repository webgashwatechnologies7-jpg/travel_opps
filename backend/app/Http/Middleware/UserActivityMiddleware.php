<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class UserActivityMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::guard('sanctum')->user();
        if ($user) {
            // Update last_seen_at if it's been more than 1 minute to save DB queries
            if (!$user->last_seen_at || $user->last_seen_at->diffInMinutes(now()) >= 1) {
                $user->last_seen_at = now();
                $user->save();

                // Also update the latest login log activity
                \App\Models\UserLoginLog::where('user_id', $user->id)
                    ->whereNull('logout_at')
                    ->orderByDesc('login_at')
                    ->first()
                    ?->update(['last_activity_at' => now()]);
            }
        }
        return $next($request);
    }
}
