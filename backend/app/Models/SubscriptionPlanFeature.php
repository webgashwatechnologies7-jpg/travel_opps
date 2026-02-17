<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SubscriptionPlanFeature extends Model
{
    use HasFactory;

    protected $fillable = [
        'subscription_plan_id',
        'feature_key',
        'feature_name',
        'is_enabled',
        'limit_value', // For features with limits (e.g., max_emails_per_month)
    ];

    protected $casts = [
        'is_enabled' => 'boolean',
        'limit_value' => 'integer',
    ];

    /**
     * Get the subscription plan that owns this feature.
     */
    public function subscriptionPlan()
    {
        return $this->belongsTo(SubscriptionPlan::class);
    }

    /**
     * Available CRM features list
     */
    public static function getAvailableFeatures()
    {
        return [
            // Core Features
            'leads_management' => [
                'name' => 'Leads Management',
                'description' => 'Create, view, edit, and manage leads',
                'has_limit' => false,
            ],
            'leads_import_export' => [
                'name' => 'Leads Import/Export',
                'description' => 'Import and export leads via CSV/Excel',
                'has_limit' => false,
            ],
            'followups' => [
                'name' => 'Followups',
                'description' => 'Create and manage followups',
                'has_limit' => false,
            ],
            'payments' => [
                'name' => 'Payments',
                'description' => 'Track and manage payments',
                'has_limit' => false,
            ],

            // Itinerary Features
            'itineraries' => [
                'name' => 'Itineraries/Packages',
                'description' => 'Create and manage travel packages',
                'has_limit' => false,
            ],
            'day_itineraries' => [
                'name' => 'Day Itineraries',
                'description' => 'Create detailed day-by-day itineraries',
                'has_limit' => false,
            ],

            // Master Data
            'hotels' => [
                'name' => 'Hotels Management',
                'description' => 'Manage hotels and hotel rates',
                'has_limit' => false,
            ],
            'activities' => [
                'name' => 'Activities',
                'description' => 'Manage activities and activity prices',
                'has_limit' => false,
            ],
            'transfers' => [
                'name' => 'Transfers',
                'description' => 'Manage transfers and transfer prices',
                'has_limit' => false,
            ],
            'suppliers' => [
                'name' => 'Suppliers',
                'description' => 'Manage supplier contacts',
                'has_limit' => false,
            ],
            'destinations' => [
                'name' => 'Destinations',
                'description' => 'Manage destinations',
                'has_limit' => false,
            ],

            // Communication Features
            'email_templates' => [
                'name' => 'Email Templates',
                'description' => 'Create and use email templates',
                'has_limit' => false,
            ],
            'gmail_integration' => [
                'name' => 'Gmail Integration',
                'description' => 'Connect and sync with Gmail',
                'has_limit' => false,
            ],
            'whatsapp' => [
                'name' => 'WhatsApp Integration',
                'description' => 'Send WhatsApp messages',
                'has_limit' => true,
                'limit_label' => 'Messages per month',
            ],

            // Marketing & Automation
            'campaigns' => [
                'name' => 'Email Campaigns',
                'description' => 'Create and run email campaigns',
                'has_limit' => true,
                'limit_label' => 'Campaigns per month',
            ],
            'google_sheets_sync' => [
                'name' => 'Google Sheets Sync',
                'description' => 'Sync data with Google Sheets',
                'has_limit' => false,
            ],
            'sms_campaigns' => [
                'name' => 'SMS Campaigns',
                'description' => 'Create and run SMS campaigns',
                'has_limit' => true,
                'limit_label' => 'Messages per month',
            ],
            'landing_pages' => [
                'name' => 'Landing Pages',
                'description' => 'Create and host landing pages',
                'has_limit' => true,
                'limit_label' => 'Active pages',
            ],
            'social_media' => [
                'name' => 'Social Media Integration',
                'description' => 'Connect and post to social media',
                'has_limit' => false,
            ],
            'marketing_automation' => [
                'name' => 'Marketing Automation',
                'description' => 'Create automated marketing workflows',
                'has_limit' => true,
                'limit_label' => 'Active workflows',
            ],
            'ab_testing' => [
                'name' => 'A/B Testing',
                'description' => 'Run A/B tests for campaigns',
                'has_limit' => false,
            ],

            // Reports & Analytics
            'reports' => [
                'name' => 'Reports',
                'description' => 'Access sales and performance reports',
                'has_limit' => false,
            ],
            'analytics' => [
                'name' => 'Analytics Dashboard',
                'description' => 'View detailed analytics and insights',
                'has_limit' => false,
            ],
            'performance_tracking' => [
                'name' => 'Performance Tracking',
                'description' => 'Track employee performance',
                'has_limit' => false,
            ],

            // HR Features
            'targets' => [
                'name' => 'Targets Management',
                'description' => 'Set and track employee targets',
                'has_limit' => false,
            ],
            'expenses' => [
                'name' => 'Expense Management',
                'description' => 'Track and manage expenses',
                'has_limit' => false,
            ],

            // Admin Features
            'user_management' => [
                'name' => 'User Management',
                'description' => 'Add and manage users',
                'has_limit' => false,
            ],
            'permissions' => [
                'name' => 'Role & Permissions',
                'description' => 'Manage roles and permissions',
                'has_limit' => false,
            ],
            'company_settings' => [
                'name' => 'Company Settings',
                'description' => 'Customize company settings',
                'has_limit' => false,
            ],

            // Advanced Features
            'api_access' => [
                'name' => 'API Access',
                'description' => 'Access to API endpoints',
                'has_limit' => false,
            ],
            'custom_domain' => [
                'name' => 'Custom Domain',
                'description' => 'Use custom domain (c.yourdomain.com)',
                'has_limit' => false,
            ],
            'white_label' => [
                'name' => 'White Label',
                'description' => 'Remove TravelOps branding',
                'has_limit' => false,
            ],
            'priority_support' => [
                'name' => 'Priority Support',
                'description' => 'Priority customer support',
                'has_limit' => false,
            ],
        ];
    }
}

