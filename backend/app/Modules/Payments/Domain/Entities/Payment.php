<?php

namespace App\Modules\Payments\Domain\Entities;

use App\Models\User;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Scopes\ScopeByLeadAccess;

class Payment extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'lead_payments';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'lead_id',
        'amount',
        'paid_amount',
        'due_date',
        'status',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_date' => 'date',
        'status' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the lead that this payment belongs to.
     *
     * @return BelongsTo
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    /**
     * Get the user who created this payment.
     *
     * @return BelongsTo
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Calculate payment status based on amount and paid_amount.
     *
     * @param float $amount
     * @param float $paidAmount
     * @return string
     */
    public static function calculateStatus(float $amount, float $paidAmount): string
    {
        if ($paidAmount == 0) {
            return 'pending';
        } elseif ($paidAmount > 0 && $paidAmount < $amount) {
            return 'partial';
        } else {
            return 'paid';
        }
    }

    /**
     * The "booted" method of the model.
     */
    protected static function booted(): void
    {
        static::addGlobalScope(new ScopeByLeadAccess);
    }
}

