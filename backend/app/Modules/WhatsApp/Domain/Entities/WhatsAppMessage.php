<?php

namespace App\Modules\WhatsApp\Domain\Entities;

use App\Models\Company;
use App\Models\User;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WhatsAppMessage extends Model
{
    protected $fillable = [
        'company_id',
        'user_id',
        'lead_id',
        'whatsapp_chat_id',
        'whatsapp_message_id',
        'from',
        'to',
        'message',
        'direction',
        'status',
        'media_url',
        'media_type',
        'media_caption',
        'is_template',
        'template_name',
        'template_data',
        'received_at',
    ];

    protected $casts = [
        'is_template' => 'boolean',
        'template_data' => 'json',
        'received_at' => 'datetime',
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

    public function chat(): BelongsTo
    {
        return $this->belongsTo(WhatsAppChat::class, 'whatsapp_chat_id');
    }
}
