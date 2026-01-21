<?php

namespace App\Modules\Calls\Domain\Entities;

use App\Models\User;
use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PhoneNumberMapping extends Model
{
    use HasFactory, HasCompany;

    protected $table = 'phone_number_mappings';

    protected $fillable = [
        'company_id',
        'user_id',
        'phone_number',
        'normalized_phone',
        'label',
        'contact_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::saving(function (self $mapping) {
            if ($mapping->phone_number) {
                $mapping->normalized_phone = self::normalizePhoneNumber($mapping->phone_number);
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public static function normalizePhoneNumber(string $phone): string
    {
        return normalize_phone_number($phone);
    }
}
