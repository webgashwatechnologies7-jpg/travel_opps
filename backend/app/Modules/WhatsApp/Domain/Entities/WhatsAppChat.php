<?php

namespace App\Modules\WhatsApp\Domain\Entities;

use App\Models\Company;
use App\Models\User;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WhatsAppChat extends Model
{
    protected $fillable = [
        'company_id',
        'user_id',
        'lead_id',
        'chat_id',
        'unread_count',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(WhatsAppMessage::class, 'whatsapp_chat_id');
    }
}
