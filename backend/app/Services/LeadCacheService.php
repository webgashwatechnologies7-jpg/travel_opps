<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class LeadCacheService
{
    /**
     * Cache lead statistics for dashboard
     */
    public static function getLeadStats(int $companyId): array
    {
        $cacheKey = "lead_stats_{$companyId}";
        
        return Cache::remember($cacheKey, 300, function () use ($companyId) {
            return [
                'total' => DB::table('leads')
                    ->where('company_id', $companyId)
                    ->count(),
                'new' => DB::table('leads')
                    ->where('company_id', $companyId)
                    ->where('status', 'new')
                    ->count(),
                'hot' => DB::table('leads')
                    ->where('company_id', $companyId)
                    ->where('priority', 'hot')
                    ->count(),
                'this_month' => DB::table('leads')
                    ->where('company_id', $companyId)
                    ->whereMonth('created_at', now()->month)
                    ->count(),
            ];
        });
    }
    
    /**
     * Clear lead-related caches
     */
    public static function clearLeadCache(int $companyId): void
    {
        $keys = [
            "lead_stats_{$companyId}",
            "lead_list_{$companyId}",
        ];
        
        foreach ($keys as $key) {
            Cache::forget($key);
        }
    }
    
    /**
     * Get cached lead list with pagination
     */
    public static function getCachedLeads(int $companyId, array $filters = [], int $perPage = 15): array
    {
        $cacheKey = "lead_list_{$companyId}_" . md5(serialize($filters) . $perPage);
        
        return Cache::remember($cacheKey, 60, function () use ($companyId, $filters, $perPage) {
            // This would integrate with your LeadRepository
            return [];
        });
    }
}
