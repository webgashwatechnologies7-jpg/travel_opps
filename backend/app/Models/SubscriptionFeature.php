<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubscriptionFeature extends Model
{
    protected $fillable = [
        'key',
        'name',
        'description',
        'has_limit',
        'limit_label',
    ];

    protected $casts = [
        'has_limit' => 'boolean',
    ];

    public function plans()
    {
        return $this->belongsToMany(SubscriptionPlan::class, 'plan_features', 'subscription_feature_id', 'subscription_plan_id')
            ->withPivot('is_active', 'limit_value')
            ->withTimestamps();
    }
}
