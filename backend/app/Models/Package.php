<?php

namespace App\Models;

use App\Models\User;
use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Package extends Model
{
    use HasFactory, HasCompany;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'packages';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'itinerary_name',
        'start_date',
        'end_date',
        'adult',
        'child',
        'destinations',
        'notes',
        'terms_conditions',
        'refund_policy',
        'package_description',
        'duration',
        'price',
        'website_cost',
        'show_on_website',
        'image',
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
        'duration' => 'integer',
        'price' => 'decimal:2',
        'website_cost' => 'decimal:2',
        'show_on_website' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created this package.
     *
     * @return BelongsTo
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Calculate duration from start and end dates.
     *
     * @return void
     */
    public function calculateDuration(): void
    {
        if ($this->start_date && $this->end_date) {
            $start = \Carbon\Carbon::parse($this->start_date);
            $end = \Carbon\Carbon::parse($this->end_date);
            $this->duration = $start->diffInDays($end) + 1; // +1 to include both start and end days
        }
    }
}

