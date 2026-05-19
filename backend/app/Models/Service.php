<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

use App\Traits\HasCompany;

class Service extends Model
{
    use HasFactory, HasCompany;

    protected $fillable = [
        'name',
        'description',
        'status',
        'company_id'
    ];

    protected $casts = [
        'status' => 'string',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
