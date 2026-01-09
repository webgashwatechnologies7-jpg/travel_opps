<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CompanySettings extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'company_settings';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'sidebar_color',
        'dashboard_background_color',
        'header_background_color',
    ];

    /**
     * Get the company that owns the settings.
     *
     * @return BelongsTo
     */
    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the current company settings (singleton pattern per company).
     *
     * @param int|null $companyId
     * @return CompanySettings
     */
    public static function getSettings(?int $companyId = null): self
    {
        if (!$companyId) {
            $companyId = tenant('id');
        }

        $settings = self::where('company_id', $companyId)->first();
        
        if (!$settings) {
            // Create default settings if none exist
            $settings = self::create([
                'company_id' => $companyId,
                'sidebar_color' => '#2765B0',
                'dashboard_background_color' => '#D8DEF5',
                'header_background_color' => '#D8DEF5',
            ]);
        }
        
        return $settings;
    }
}

