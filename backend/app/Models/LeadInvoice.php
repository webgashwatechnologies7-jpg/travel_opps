<?php

namespace App\Models;

use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

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
        $last = self::whereDate('created_at', today())->count() + 1;
        return $prefix . '-' . $date . '-' . str_pad((string) $last, 4, '0', STR_PAD_LEFT);
    }
}
