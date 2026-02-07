<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LandingPage extends Model
{
    use HasFactory;

    protected $fillable = [
        'company_id',
        'name',
        'title',
        'url_slug',
        'template',
        'meta_description',
        'content',
        'sections',
        'status',
        'views',
        'conversions',
        'conversion_rate',
        'published_at',
        'created_by',
    ];

    protected $casts = [
        'published_at' => 'datetime',
        'views' => 'integer',
        'conversions' => 'integer',
        'conversion_rate' => 'decimal:2',
        'sections' => 'array',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
