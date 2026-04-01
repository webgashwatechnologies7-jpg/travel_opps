<?php

namespace App\Modules\Leads\Infrastructure\Repositories;

use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Leads\Domain\Interfaces\LeadRepositoryInterface;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class LeadRepository implements LeadRepositoryInterface
{
    /**
     * Get paginated leads with filters.
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getPaginated(array $filters = [], int $perPage = 8): LengthAwarePaginator
    {
        $query = Lead::query();
        $this->applyFilters($query, $filters);

        // Load assigned user relationship
        $query->with('assignedUser:id,name,email');

        return $query->latest()->paginate($perPage);
    }

    /**
     * Get analytics data for leads.
     *
     * @param array $filters
     * @param string $timeframe
     * @return array
     */
    public function getAnalytics(array $filters = [], string $timeframe = 'month'): array
    {
        $query = Lead::query();
        $this->applyFilters($query, $filters);

        // Grouping logic based on timeframe
        switch ($timeframe) {
            case 'day':
                $query->selectRaw('DATE(created_at) as label, COUNT(*) as total, SUM(CASE WHEN status = "confirmed" THEN 1 ELSE 0 END) as confirmed')
                    ->where('created_at', '>=', now()->subDays(7))
                    ->groupBy('label')
                    ->orderBy('label', 'asc');
                break;
            case 'week':
                $query->selectRaw('DATE_FORMAT(created_at, "%Y-%u") as label, COUNT(*) as total, SUM(CASE WHEN status = "confirmed" THEN 1 ELSE 0 END) as confirmed')
                    ->where('created_at', '>=', now()->subWeeks(8))
                    ->groupBy('label')
                    ->orderBy('label', 'asc');
                break;
            case 'year':
                $query->selectRaw('YEAR(created_at) as label, COUNT(*) as total, SUM(CASE WHEN status = "confirmed" THEN 1 ELSE 0 END) as confirmed')
                    ->groupBy('label')
                    ->orderBy('label', 'asc');
                break;
            case 'month':
            default:
                $query->selectRaw('DATE_FORMAT(created_at, "%Y-%m") as label, COUNT(*) as total, SUM(CASE WHEN status = "confirmed" THEN 1 ELSE 0 END) as confirmed')
                    ->where('created_at', '>=', now()->subMonths(12))
                    ->groupBy('label')
                    ->orderBy('label', 'asc');
                break;
        }

        return $query->get()->toArray();
    }

    /**
     * Apply common filters to the query.
     *
     * @param Builder $query
     * @param array $filters
     * @return void
     */
    private function applyFilters(Builder $query, array $filters): void
    {
        // Always filter by company for multi-tenant isolation
        if (isset($filters['company_id']) && $filters['company_id']) {
            $query->where('company_id', $filters['company_id']);
        }
        // Apply filters with optimized queries
        if (isset($filters['status']) && $filters['status']) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['assigned_to']) && $filters['assigned_to']) {
            $query->where('assigned_to', $filters['assigned_to']);
        }

        if (isset($filters['source']) && $filters['source']) {
            $query->where('source', $filters['source']);
        }

        if (isset($filters['destination']) && $filters['destination']) {
            $dest = $filters['destination'];
            $query->where(function($q) use ($dest) {
                $q->where('destination', 'like', '%' . $dest . '%')
                  ->orWhereHas('assignedUser', function($sq) use ($dest) {
                      $sq->where('name', 'like', '%' . $dest . '%');
                  });
            });
        }

        if (isset($filters['priority']) && $filters['priority']) {
            $query->where('priority', $filters['priority']);
        }

        if (isset($filters['created_by']) && $filters['created_by']) {
            $query->where('created_by', $filters['created_by']);
        }

        if (isset($filters['birth_month']) && $filters['birth_month']) {
            $query->whereMonth('date_of_birth', $filters['birth_month']);
        }

        if (isset($filters['anniversary_month']) && $filters['anniversary_month']) {
            $query->whereMonth('marriage_anniversary', $filters['anniversary_month']);
        }

        // Date Filters - Exact Travel Date Match (Start and End)
        if (isset($filters['from_date']) && $filters['from_date']) {
            $query->whereDate('travel_start_date', '=', $filters['from_date']);
        }

        if (isset($filters['to_date']) && $filters['to_date']) {
            $query->whereDate('travel_end_date', '=', $filters['to_date']);
        }

        // Creation Date Filters (Explicit)
        if (isset($filters['created_from']) && $filters['created_from']) {
            $query->whereDate('created_at', '>=', $filters['created_from']);
        }

        if (isset($filters['created_to']) && $filters['created_to']) {
            $query->whereDate('created_at', '<=', $filters['created_to']);
        }

        if (isset($filters['travel_month']) && $filters['travel_month']) {
            $query->whereRaw('MONTHNAME(travel_start_date) = ?', [$filters['travel_month']]);
        }

        if (isset($filters['service']) && $filters['service']) {
            $query->where('service', 'like', '%' . $filters['service'] . '%');
        }

        if (isset($filters['adult']) && $filters['adult']) {
            $query->where('adult', $filters['adult']);
        }

        if (isset($filters['description']) && $filters['description']) {
            $query->where('remark', 'like', '%' . $filters['description'] . '%');
        }

        if (isset($filters['unassigned']) && $filters['unassigned']) {
            $query->whereNull('assigned_to');
        }

        if (isset($filters['today']) && $filters['today']) {
            $query->whereDate('created_at', now()->toDateString());
        }

        if (isset($filters['search']) && $filters['search']) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('client_name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('phone', 'like', '%' . $search . '%');
            });
        }
    }

    /**
     * Find a lead by ID with relationships.
     *
     * @param int $id
     * @return Lead|null
     */
    public function findById(int $id): ?Lead
    {
        return Lead::with(['assignedUser', 'creator', 'followups.user', 'statusLogs.changedBy'])
            ->find($id);
    }

    /**
     * Create a new lead.
     *
     * @param array $data
     * @return Lead
     */
    public function create(array $data): Lead
    {
        return Lead::create($data);
    }

    /**
     * Update a lead.
     *
     * @param int $id
     * @param array $data
     * @return Lead|null
     */
    public function update(int $id, array $data): ?Lead
    {
        $lead = Lead::find($id);

        if (!$lead) {
            return null;
        }

        $lead->update($data);
        $lead->refresh();

        return $lead;
    }

    /**
     * Soft delete a lead.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool
    {
        $lead = Lead::find($id);

        if (!$lead) {
            return false;
        }

        return $lead->delete();
    }

    /**
     * Bulk delete leads.
     *
     * @param array $ids
     * @return bool
     */
    public function bulkDelete(array $ids): bool
    {
        return Lead::whereIn('id', $ids)->delete() > 0;
    }

    /**
     * Bulk assign leads.
     *
     * @param array $ids
     * @param int $userId
     * @return bool
     */
    public function bulkAssign(array $ids, int $userId): bool
    {
        return Lead::whereIn('id', $ids)->update(['assigned_to' => $userId]) > 0;
    }
}

