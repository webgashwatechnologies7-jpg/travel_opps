<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CrmEmail extends Model
{
    use HasFactory;

    protected $fillable = [
        'lead_id',
        'from_email',
        'to_email',
        'subject',
        'body',
        'thread_id',
        'gmail_message_id',
        'direction',
        'status',
        'is_read',
        'opened_at',
        'track_token',
    ];

    protected $casts = [
        'is_read' => 'boolean',
        'opened_at' => 'datetime',
    ];

    public function lead()
    {
        return $this->belongsTo(\App\Modules\Leads\Domain\Entities\Lead::class);
    }
}
