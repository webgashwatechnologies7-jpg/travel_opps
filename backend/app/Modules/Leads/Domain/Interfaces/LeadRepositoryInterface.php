<?php

namespace App\Modules\Leads\Domain\Interfaces;

use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

interface LeadRepositoryInterface
{
    /**
     * Get paginated leads with filters.
     *
     * @param array $filters
     * @param int $perPage
     * @return LengthAwarePaginator
     */
    public function getPaginated(array $filters = [], int $perPage = 15): LengthAwarePaginator;

    /**
     * Find a lead by ID with relationships.
     *
     * @param int $id
     * @return Lead|null
     */
    public function findById(int $id): ?Lead;

    /**
     * Create a new lead.
     *
     * @param array $data
     * @return Lead
     */
    public function create(array $data): Lead;

    /**
     * Update a lead.
     *
     * @param int $id
     * @param array $data
     * @return Lead|null
     */
    public function update(int $id, array $data): ?Lead;

    /**
     * Soft delete a lead.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id): bool;
}

