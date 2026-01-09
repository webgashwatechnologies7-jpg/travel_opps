<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'city',
        'company_name',
        'title',
        'first_name',
        'last_name',
        'email',
        'phone_code',
        'mobile',
        'address',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the full name attribute.
     *
     * @return string
     */
    public function getNameAttribute(): string
    {
        $name = trim("{$this->title} {$this->first_name} {$this->last_name}");
        return $name ?: 'N/A';
    }

    /**
     * Get the company attribute (alias for company_name).
     *
     * @return string
     */
    public function getCompanyAttribute(): string
    {
        return $this->company_name;
    }

    /**
     * Get the location attribute (alias for city).
     *
     * @return string
     */
    public function getLocationAttribute(): string
    {
        return $this->city ?: 'N/A';
    }
}
