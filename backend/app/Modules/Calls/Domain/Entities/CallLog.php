<?php

namespace App\Modules\Calls\Domain\Entities;

use App\Models\User;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

class CallLog extends Model
{
    use HasFactory, HasCompany;

    protected $table = 'call_logs';

    protected $fillable = [
        'company_id',
        'user_id',
        'lead_id',
        'source',
        'status',
        'provider',
        'provider_call_id',
        'recording_sid',
        'recording_url',
        'duration_seconds',
        'from_number',
        'from_number_normalized',
        'to_number',
        'to_number_normalized',
        'mapped_number',
        'mapped_number_normalized',
        'mapping_status',
        'contact_name',
        'contact_phone',
        'contact_phone_normalized',
        'call_started_at',
        'call_ended_at',
    ];

    protected $casts = [
        'duration_seconds' => 'integer',
        'call_started_at' => 'datetime',
        'call_ended_at' => 'datetime',
        'mapping_status' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $hidden = [
        'recording_url',
    ];

    protected $appends = [
        'recording_available',
    ];

    protected static function booted()
    {
        static::saving(function (self $call) {
            if ($call->from_number) {
                $call->from_number_normalized = self::normalizePhoneNumber($call->from_number);
            }
            if ($call->to_number) {
                $call->to_number_normalized = self::normalizePhoneNumber($call->to_number);
            }
            if ($call->mapped_number) {
                $call->mapped_number_normalized = self::normalizePhoneNumber($call->mapped_number);
            }
            if ($call->contact_phone) {
                $call->contact_phone_normalized = self::normalizePhoneNumber($call->contact_phone);
            }
        });
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function notes(): HasMany
    {
        return $this->hasMany(CallNote::class, 'call_log_id');
    }

    public function setRecordingUrlAttribute(?string $value): void
    {
        if (!$value) {
            $this->attributes['recording_url'] = null;
            return;
        }

        $this->attributes['recording_url'] = Crypt::encryptString($value);
    }

    public function getRecordingUrlAttribute(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        try {
            return Crypt::decryptString($value);
        } catch (\Throwable $e) {
            return null;
        }
    }

    public function getRecordingAvailableAttribute(): bool
    {
        return (bool) ($this->recording_url || $this->recording_sid);
    }

    public static function normalizePhoneNumber(string $phone): string
    {
        return normalize_phone_number($phone);
    }
}
