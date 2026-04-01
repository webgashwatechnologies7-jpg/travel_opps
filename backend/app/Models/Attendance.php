<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_id',
        'date',
        'punch_in',
        'punch_out',
        'total_hours',
        'overtime_hours',
        'status',
        'ip_address',
        'is_remote',
        'note',
    ];

    protected $casts = [
        'date' => 'date',
        'is_remote' => 'boolean',
        'total_hours' => 'decimal:2',
        'overtime_hours' => 'decimal:2',
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
