<?php

namespace App\Models;

use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmployeeFinancialTransaction extends Model
{
    protected $table = 'employee_financial_transactions';

    protected $fillable = [
        'company_id',
        'user_id',
        'type',
        'category',
        'amount',
        'paid_amount',
        'lead_id',
        'transaction_date',
        'due_date',
        'status',
        'description',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'transaction_date' => 'date',
        'due_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public const TYPE_PAYABLE = 'payable';   // Company owes employee (kitna dena)
    public const TYPE_RECEIVABLE = 'receivable'; // Employee owes company (kitna lena)

    public const STATUS_PENDING = 'pending';
    public const STATUS_PARTIAL = 'partial';
    public const STATUS_PAID = 'paid';
    public const STATUS_SETTLED = 'settled';

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get outstanding amount (amount - paid_amount).
     */
    public function getOutstandingAmountAttribute(): float
    {
        return (float) ($this->amount - $this->paid_amount);
    }

    /**
     * Update status based on paid_amount.
     */
    public function updateStatus(): void
    {
        if ($this->paid_amount >= $this->amount) {
            $this->status = $this->type === self::TYPE_PAYABLE ? self::STATUS_PAID : self::STATUS_SETTLED;
        } elseif ($this->paid_amount > 0) {
            $this->status = self::STATUS_PARTIAL;
        } else {
            $this->status = self::STATUS_PENDING;
        }
        $this->save();
    }
}
