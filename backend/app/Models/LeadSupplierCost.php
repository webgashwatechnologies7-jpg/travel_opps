<?php

namespace App\Models;

use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadSupplierCost extends Model
{
    protected $table = 'lead_supplier_costs';

    protected $fillable = [
        'company_id',
        'lead_id',
        'supplier_id',
        'cost_amount',
        'service_type',
        'transaction_date',
        'description',
        'created_by',
    ];

    protected $casts = [
        'cost_amount' => 'decimal:2',
        'transaction_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
