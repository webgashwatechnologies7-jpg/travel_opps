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
    public function getPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = Lead::query();

        // Apply filters
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
            $query->where('destination', 'like', '%' . $filters['destination'] . '%');
        }

        if (isset($filters['priority']) && $filters['priority']) {
            $query->where('priority', $filters['priority']);
        }

        // Order by latest first
        $query->latest();

        return $query->paginate($perPage);
    }

    /**
     * Find a lead by ID with relationships.
     *
     * @param int $id
     * @return Lead|null
     */
    public function findById(int $id): ?Lead
    {
        return Lead::with(['assignedUser', 'creator', 'followups', 'statusLogs'])
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
}

