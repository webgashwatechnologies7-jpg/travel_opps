<?php

namespace App\Models;

use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class ClientGroup extends Model
{
    protected $fillable = [
        'company_id',
        'name',
        'description',
        'type',
        'status',
        'created_by',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function leads(): BelongsToMany
    {
        return $this->belongsToMany(Lead::class, 'client_group_lead', 'client_group_id', 'lead_id')
            ->withTimestamps();
    }
}
