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
    ];

    public function lead()
    {
        return $this->belongsTo(\App\Modules\Leads\Domain\Entities\Lead::class);
    }
}
