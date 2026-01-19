<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MarketingTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'subject',
        'content',
        'variables',
        'is_active',
        'created_by',
    ];

    protected $casts = [
        'variables' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * Get the creator of the template.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get email campaigns using this template.
     */
    public function emailCampaigns(): HasMany
    {
        return $this->hasMany(EmailCampaign::class);
    }

    /**
     * Get SMS campaigns using this template.
     */
    public function smsCampaigns(): HasMany
    {
        return $this->hasMany(SmsCampaign::class);
    }

    /**
     * Scope to get email templates.
     */
    public function scopeEmail($query)
    {
        return $query->where('type', 'email');
    }

    /**
     * Scope to get SMS templates.
     */
    public function scopeSms($query)
    {
        return $query->where('type', 'sms');
    }

    /**
     * Scope to get WhatsApp templates.
     */
    public function scopeWhatsapp($query)
    {
        return $query->where('type', 'whatsapp');
    }

    /**
     * Scope to get active templates.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Process template content with variables.
     */
    public function processContent(array $variables = []): string
    {
        $content = $this->content;
        
        foreach ($variables as $key => $value) {
            $content = str_replace('{{' . $key . '}}', $value, $content);
        }
        
        return $content;
    }

    /**
     * Get template preview with sample data.
     */
    public function getPreviewAttribute(): string
    {
        $sampleData = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'phone' => '+1234567890',
            'company' => 'Example Company',
            'message' => 'This is a sample message content',
        ];
        
        return $this->processContent($sampleData);
    }
}
