<?php

namespace App\Models;

use App\Models\User;
use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hotel extends Model
{
    use HasFactory, HasCompany;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'name',
        'category',
        'destination',
        'hotel_details',
        'hotel_photo',
        'contact_person',
        'email',
        'phone',
        'hotel_address',
        'hotel_link',
        'status',
        'price_updates_count',
        'created_by',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'category' => 'integer',
        'price_updates_count' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the user who created this hotel.
     *
     * @return BelongsTo
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the rates for this hotel.
     *
     * @return HasMany
     */
    public function rates(): HasMany
    {
        return $this->hasMany(HotelRate::class);
    }

    public function leadHotelCosts(): HasMany
    {
        return $this->hasMany(LeadHotelCost::class);
    }
}
