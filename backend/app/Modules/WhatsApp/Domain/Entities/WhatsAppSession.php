<?php

namespace App\Modules\WhatsApp\Domain\Entities;

use App\Models\User;
use App\Models\Company;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppSession extends Model
{
    protected $fillable = [
        'user_id',
        'company_id',
        'session_name',
        'qr_code',
        'status',
        'phone_number',
        'is_encrypted',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }
}
