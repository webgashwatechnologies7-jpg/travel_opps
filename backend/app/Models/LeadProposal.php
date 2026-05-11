<?php

namespace App\Models;

use App\Models\User;
use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeadProposal extends Model
{
    use HasFactory, HasCompany, SoftDeletes;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'lead_proposals';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'lead_id',
        'original_package_id',
        'itinerary_name',
        'start_date',
        'end_date',
        'adult',
        'child',
        'infant',
        'destinations',
        'routing',
        'notes',
        'terms_conditions',
        'refund_policy',
        'package_description',
        'duration',
        'price',
        'website_cost',
        'show_on_website',
        'image',
        'day_events',
        'days',
        'options_data',
        'inclusions',
        'exclusions',
        'confirmation_policy',
        'amendment_policy',
        'payment_policy',
        'remarks',
        'thank_you_message',
        'pricing_data',
        'final_client_prices',
        'option_gst_settings',
        'base_markup',
        'extra_markup',
        'cgst',
        'sgst',
        'igst',
        'tcs',
        'discount',
        'is_confirmed',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'adult' => 'integer',
        'child' => 'integer',
        'infant' => 'integer',
        'duration' => 'integer',
        'price' => 'decimal:2',
        'website_cost' => 'decimal:2',
        'show_on_website' => 'boolean',
        'day_events' => 'array',
        'days' => 'array',
        'options_data' => 'array',
        'inclusions' => 'array',
        'exclusions' => 'array',
        'terms_conditions' => 'array',
        'refund_policy' => 'array',
        'confirmation_policy' => 'array',
        'amendment_policy' => 'array',
        'payment_policy' => 'array',
        'remarks' => 'array',
        'thank_you_message' => 'array',
        'pricing_data' => 'array',
        'final_client_prices' => 'array',
        'option_gst_settings' => 'array',
        'base_markup' => 'decimal:2',
        'extra_markup' => 'decimal:2',
        'cgst' => 'decimal:2',
        'sgst' => 'decimal:2',
        'igst' => 'decimal:2',
        'tcs' => 'decimal:2',
        'discount' => 'decimal:2',
        'is_confirmed' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created this proposal.
     *
     * @return BelongsTo
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the master lead.
     *
     * @return BelongsTo
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    /**
     * Get the original package template.
     *
     * @return BelongsTo
     */
    public function originalPackage(): BelongsTo
    {
        return $this->belongsTo(Package::class, 'original_package_id');
    }
}
