<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'is_active',
        'company_id',
        'branch_id',
        'is_super_admin',
        'google_token',
        'google_refresh_token',
        'google_token_expires_at',
        'gmail_email',
        'company_name',
        'gst_number',
        'city',
        'user_type',
        'created_by'
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_active' => 'boolean',
        'is_super_admin' => 'boolean',
        'last_login_at' => 'datetime',
        'google_token_expires_at' => 'datetime',
    ];

    /**
     * Get the company that owns the user.
     *
     * @return BelongsTo
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the branch that owns the user.
     *
     * @return BelongsTo
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    /**
     * Get the employee targets for the user.
     *
     * @return HasMany
     */
    public function targets(): HasMany
    {
        return $this->hasMany(\App\Modules\Hr\Domain\Entities\EmployeeTarget::class, 'user_id');
    }

    /**
     * Get leads assigned to this user.
     *
     * @return HasMany
     */
    public function leadsAssigned(): HasMany
    {
        return $this->hasMany(\App\Modules\Leads\Domain\Entities\Lead::class, 'assigned_to');
    }

    /**
     * Get performance logs for this user.
     *
     * @return HasMany
     */
    public function performanceLogs(): HasMany
    {
        return $this->hasMany(\App\Models\EmployeePerformanceLog::class, 'user_id');
    }

    /**
     * Get push notification tokens for the user.
     *
     * @return HasMany
     */
    public function pushTokens(): HasMany
    {
        return $this->hasMany(\App\Models\PushToken::class, 'user_id');
    }

    /**
     * Check if user is super admin.
     *
     * @return bool
     */
    public function isSuperAdmin(): bool
    {
        return $this->is_super_admin === true;
    }
}
