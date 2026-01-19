<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== 📢 SETTING UP MARKETING MODULE ===\n\n";

// 1. Create sample marketing templates
echo "1. 📧 Creating Sample Marketing Templates:\n";

$templates = [
    [
        'name' => 'Welcome Email Template',
        'type' => 'email',
        'subject' => 'Welcome to {{company_name}}!',
        'content' => 'Dear {{name}},

Thank you for your interest in {{company_name}}. We are excited to help you with your travel needs.

About our company:
{{company_description}}

Our Services:
- Flight Booking
- Hotel Reservations
- Tour Packages
- Travel Insurance

Next Steps:
1. Browse our packages at {{website_url}}
2. Contact us at {{phone}}
3. Visit our office at {{address}}

Best regards,
{{agent_name}}
{{company_name}}
{{email}}
{{phone}}',
        'variables' => ['name', 'company_name', 'company_description', 'website_url', 'phone', 'address', 'agent_name', 'email'],
        'is_active' => true,
        'created_by' => 1,
    ],
    [
        'name' => 'Special Offer SMS',
        'type' => 'sms',
        'content' => 'Hi {{name}}! Special offer: Get {{discount}}% off on {{package_name}}. Limited time only. Call {{phone}} to book!',
        'variables' => ['name', 'discount', 'package_name', 'phone'],
        'is_active' => true,
        'created_by' => 1,
    ],
    [
        'name' => 'Holiday Package Promotion',
        'type' => 'email',
        'subject' => '🎉 Special Holiday Packages - Up to {{discount}}% OFF!',
        'content' => 'Hello {{name}},

🎄 Holiday Special Offer from {{company_name}}! 🎄

Exclusive Deals for You:
✈️ {{package_1_name}} - {{package_1_price}}
🏨️ {{package_2_name}} - {{package_2_price}}
🌴 {{package_3_name}} - {{package_3_price}}

Why Choose Us?
- Best Price Guarantee
- 24/7 Customer Support
- Flexible Booking
- Expert Travel Guides

Book Now: {{booking_url}}
Call Us: {{phone}}
Visit Us: {{address}}

Offer valid until: {{expiry_date}}

Happy Holidays!
Team {{company_name}}',
        'variables' => ['name', 'company_name', 'discount', 'package_1_name', 'package_1_price', 'package_2_name', 'package_2_price', 'package_3_name', 'package_3_price', 'booking_url', 'phone', 'address', 'expiry_date'],
        'is_active' => true,
        'created_by' => 1,
    ],
    [
        'name' => 'WhatsApp Travel Update',
        'type' => 'whatsapp',
        'content' => 'Hi {{name}}! 🌍 Your dream vacation to {{destination}} is waiting! Special packages starting at ₹{{price}}. Details: {{package_url}}. Book now! 📞 {{phone}}',
        'variables' => ['name', 'destination', 'price', 'package_url', 'phone'],
        'is_active' => true,
        'created_by' => 1,
    ],
];

foreach ($templates as $templateData) {
    $template = \App\Models\MarketingTemplate::firstOrCreate(
        ['name' => $templateData['name']],
        $templateData
    );
    echo "✅ Template created: {$template->name} ({$template->type})\n";
}

// 2. Create sample email campaign
echo "\n2. 📨 Creating Sample Email Campaign:\n";

$leads = \App\Modules\Leads\Domain\Entities\Lead::limit(5)->get();
if ($leads->count() > 0) {
    $emailTemplate = \App\Models\MarketingTemplate::where('type', 'email')->first();
    
    $campaign = \App\Models\EmailCampaign::create([
        'name' => 'January 2026 Newsletter',
        'subject' => 'Exciting Travel Deals for January 2026',
        'template_id' => $emailTemplate->id,
        'lead_ids' => $leads->pluck('id')->toArray(),
        'status' => 'draft',
        'sent_count' => 0,
        'delivered_count' => 0,
        'open_count' => 0,
        'click_count' => 0,
        'bounce_count' => 0,
        'unsubscribe_count' => 0,
        'created_by' => 1,
    ]);
    
    echo "✅ Email campaign created: {$campaign->name}\n";
    echo "   Leads: {$leads->count()}\n";
    echo "   Template: {$emailTemplate->name}\n";
} else {
    echo "⚠️ No leads found for sample campaign\n";
}

// 3. Create sample SMS campaign
echo "\n3. 📱 Creating Sample SMS Campaign:\n";

if ($leads->count() > 0) {
    $smsTemplate = \App\Models\MarketingTemplate::where('type', 'sms')->first();
    
    $smsCampaign = \App\Models\SmsCampaign::create([
        'name' => 'Weekend Getaway Offers',
        'template_id' => $smsTemplate->id,
        'lead_ids' => $leads->pluck('id')->toArray(),
        'status' => 'draft',
        'sent_count' => 0,
        'delivered_count' => 0,
        'read_count' => 0,
        'failed_count' => 0,
        'created_by' => 1,
    ]);
    
    echo "✅ SMS campaign created: {$smsCampaign->name}\n";
    echo "   Leads: {$leads->count()}\n";
    echo "   Template: {$smsTemplate->name}\n";
}

// 4. Add marketing permissions to subscription plans
echo "\n4. 🔐 Adding Marketing Permissions:\n";

$marketingPermissions = [
    'email_campaigns',
    'sms_campaigns', 
    'marketing_templates',
    'marketing_analytics',
    'marketing_automation',
    'social_media_marketing',
];

foreach ($marketingPermissions as $permissionName) {
    $permission = \Spatie\Permission\Models\Permission::firstOrCreate(['name' => $permissionName]);
    echo "✅ Permission created: $permissionName\n";
}

// Assign to existing plans
$plans = \App\Models\SubscriptionPlan::all();
foreach ($plans as $plan) {
    $currentPermissions = $plan->permissions ?? [];
    $newPermissions = array_merge($currentPermissions, \Spatie\Permission\Models\Permission::whereIn('name', $marketingPermissions)->pluck('id')->toArray());
    $plan->update(['permissions' => array_unique($newPermissions)]);
    echo "✅ Marketing permissions added to {$plan->name}\n";
}

// 5. Update subscription plan features
echo "\n5. ⭐ Updating Subscription Plan Features:\n";

$marketingFeatures = [
    'email_campaigns' => 'Email Campaigns',
    'sms_campaigns' => 'SMS Campaigns',
    'marketing_templates' => 'Marketing Templates',
    'marketing_analytics' => 'Marketing Analytics',
    'marketing_automation' => 'Marketing Automation',
    'social_media_marketing' => 'Social Media Marketing',
];

$allPlans = \App\Models\SubscriptionPlan::all();
foreach ($allPlans as $plan) {
    foreach ($marketingFeatures as $featureKey => $featureName) {
        $feature = \App\Models\SubscriptionPlanFeature::firstOrCreate([
            'subscription_plan_id' => $plan->id,
            'feature_key' => $featureKey,
        ], [
            'feature_name' => $featureName,
            'is_enabled' => true,
            'limit_value' => null,
        ]);
    }
}

echo "✅ Marketing features added to all subscription plans\n";

echo "\n=== 🎯 MARKETING MODULE SETUP COMPLETE ===\n";
echo "\n📋 Available Features:\n";
echo "✅ Email Campaigns\n";
echo "✅ SMS Campaigns\n";
echo "✅ Marketing Templates\n";
echo "✅ Campaign Analytics\n";
echo "✅ Lead Management\n";
echo "✅ A/B Testing\n";
echo "✅ Landing Pages\n";
echo "✅ Social Media Integration\n";
echo "✅ Marketing Automation\n";

echo "\n📡 API Endpoints Available:\n";
echo "GET  /api/marketing/dashboard - Marketing dashboard\n";
echo "GET  /api/marketing/email-campaigns - Email campaigns list\n";
echo "POST /api/marketing/email-campaigns - Create email campaign\n";
echo "GET  /api/marketing/sms-campaigns - SMS campaigns list\n";
echo "POST /api/marketing/sms-campaigns - Create SMS campaign\n";
echo "GET  /api/marketing/templates - Marketing templates\n";
echo "POST /api/marketing/templates - Create template\n";
echo "GET  /api/marketing/analytics - Marketing analytics\n";
echo "GET  /api/marketing/leads - Marketing leads\n";

echo "\n🔑 Sample Templates Created:\n";
foreach ($templates as $template) {
    echo "- {$template['name']} ({$template['type']})\n";
}

echo "\n🚀 Marketing Module Ready for Use!\n";

?>
