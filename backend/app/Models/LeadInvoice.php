<?php

namespace App\Models;

use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Scopes\ScopeByLeadAccess;

class LeadInvoice extends Model
{
    protected $table = 'lead_invoices';

    protected $fillable = [
        'lead_id',
        'option_number',
        'total_amount',
        'currency',
        'itinerary_name',
        'invoice_number',
        'status',
        'metadata',
        'created_by',
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'metadata' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public static function generateInvoiceNumber(): string
    {
        $prefix = 'INV';
        $date = now()->format('Ymd');
        
        // Use withoutGlobalScopes() to ensure we see ALL invoices across the system to avoid duplicates
        // Also use a more robust way to find the next number by looking at the last one created today
        $lastInvoice = self::withoutGlobalScopes()
            ->where('invoice_number', 'LIKE', "{$prefix}-{$date}-%")
            ->orderBy('invoice_number', 'desc')
            ->first();

        if ($lastInvoice) {
            // Extract the number part: INV-20260427-0001 -> 0001
            $parts = explode('-', $lastInvoice->invoice_number);
            $lastNum = (int) end($parts);
            $nextNum = $lastNum + 1;
        } else {
            $nextNum = 1;
        }

        return $prefix . '-' . $date . '-' . str_pad((string) $nextNum, 4, '0', STR_PAD_LEFT);
    }

    protected static function booted()
    {
        static::addGlobalScope(new ScopeByLeadAccess);
    }
}
