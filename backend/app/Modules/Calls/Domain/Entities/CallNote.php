<?php

namespace App\Modules\Calls\Domain\Entities;

use App\Models\User;
use App\Traits\HasCompany;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CallNote extends Model
{
    use HasFactory, HasCompany;

    protected $table = 'call_notes';

    protected $fillable = [
        'company_id',
        'call_log_id',
        'user_id',
        'note',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function call(): BelongsTo
    {
        return $this->belongsTo(CallLog::class, 'call_log_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
