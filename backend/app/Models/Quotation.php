<?php

namespace App\Models;

use App\Models\User;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property \Illuminate\Support\Carbon|null $travel_start_date
 * @property \Illuminate\Support\Carbon|null $travel_end_date
 * @property \Illuminate\Support\Carbon|null $valid_until
 */
class Quotation extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'created_by',
        'quotation_number',
        'title',
        'description',
        'travel_start_date',
        'travel_end_date',
        'adults',
        'children',
        'infants',
        'base_price',
        'tax_amount',
        'discount_amount',
        'total_price',
        'currency',
        'status',
        'valid_until',
        'template',
        'itinerary',
        'inclusions',
        'exclusions',
        'pricing_breakdown',
        'custom_fields',
        'notes',
        'terms_conditions',
        'sent_at',
        'accepted_at',
        'rejected_at',
    ];

    protected $casts = [
        'travel_start_date' => 'date',
        'travel_end_date' => 'date',
        'adults' => 'integer',
        'children' => 'integer',
        'infants' => 'integer',
        'base_price' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'total_price' => 'decimal:2',
        'itinerary' => 'array',
        'inclusions' => 'array',
        'exclusions' => 'array',
        'pricing_breakdown' => 'array',
        'custom_fields' => 'array',
        'sent_at' => 'datetime',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'valid_until' => 'date',
    ];

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function getFormattedTotalPriceAttribute(): string
    {
        return number_format($this->total_price, 2);
    }

    public function getDurationDaysAttribute(): int
    {
        return $this->travel_start_date && $this->travel_end_date
            ? $this->travel_start_date->diffInDays($this->travel_end_date) + 1
            : 0;
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->valid_until && $this->valid_until->isPast();
    }

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['draft', 'sent']);
    }

    public function scopeExpired($query)
    {
        return $query->where('valid_until', '<', now());
    }

    protected static function booted()
    {
        static::creating(function ($quotation) {
            $quotation->quotation_number = 'QOT-' . date('Y') . '-' . str_pad((static::max('id') + 1), 5, '0', STR_PAD_LEFT);
        });
    }
}
