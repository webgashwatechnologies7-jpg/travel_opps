<?php

namespace App\Models;

use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeadTransferCost extends Model
{
    protected $table = 'lead_transfer_costs';

    protected $fillable = [
        'company_id',
        'lead_id',
        'transfer_id',
        'cost_amount',
        'revenue_amount',
        'transaction_date',
        'description',
        'created_by',
    ];

    protected $casts = [
        'cost_amount' => 'decimal:2',
        'revenue_amount' => 'decimal:2',
        'transaction_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function transfer(): BelongsTo
    {
        return $this->belongsTo(Transfer::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
