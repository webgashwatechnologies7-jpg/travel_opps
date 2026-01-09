<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;
use App\Models\SubscriptionPlanFeature;

class SubscriptionPlanSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Basic',
                'slug' => 'basic',
                'description' => 'Perfect for small travel agencies',
                'price' => 999,
                'billing_period' => 'monthly',
                'max_users' => 5,
                'max_leads' => 100,
                'features' => [
                    'Up to 5 users',
                    'Up to 100 leads per month',
                    'Basic CRM features',
                    'Email support',
                ],
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => 'Premium',
                'slug' => 'premium',
                'description' => 'Ideal for growing travel businesses',
                'price' => 2499,
                'billing_period' => 'monthly',
                'max_users' => 15,
                'max_leads' => 500,
                'features' => [
                    'Up to 15 users',
                    'Up to 500 leads per month',
                    'Advanced CRM features',
                    'WhatsApp integration',
                    'Google Mail integration',
                    'Priority support',
                ],
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => 'Enterprise',
                'slug' => 'enterprise',
                'description' => 'For large travel companies',
                'price' => 4999,
                'billing_period' => 'monthly',
                'max_users' => null, // Unlimited
                'max_leads' => null, // Unlimited
                'features' => [
                    'Unlimited users',
                    'Unlimited leads',
                    'All CRM features',
                    'Custom integrations',
                    'Dedicated support',
                    'Custom domain',
                ],
                'is_active' => true,
                'sort_order' => 3,
            ],
        ];

        foreach ($plans as $planData) {
            $features = $planData['features'] ?? [];
            unset($planData['features']);
            
            $plan = SubscriptionPlan::create($planData);
            
            // Add features based on plan type
            $this->assignFeaturesToPlan($plan, $planData['slug'], $features);
        }
    }

    private function assignFeaturesToPlan($plan, $planSlug, $customFeatures)
    {
        $availableFeatures = SubscriptionPlanFeature::getAvailableFeatures();
        
        // Define features for each plan
        $planFeatures = [
            'basic' => [
                'leads_management' => ['enabled' => true],
                'followups' => ['enabled' => true],
                'payments' => ['enabled' => true],
                'itineraries' => ['enabled' => true],
                'hotels' => ['enabled' => true],
                'activities' => ['enabled' => true],
                'transfers' => ['enabled' => true],
                'suppliers' => ['enabled' => true],
                'destinations' => ['enabled' => true],
                'reports' => ['enabled' => true],
                'expenses' => ['enabled' => true],
                'user_management' => ['enabled' => true],
                'company_settings' => ['enabled' => true],
            ],
            'premium' => [
                'leads_management' => ['enabled' => true],
                'leads_import_export' => ['enabled' => true],
                'followups' => ['enabled' => true],
                'payments' => ['enabled' => true],
                'itineraries' => ['enabled' => true],
                'day_itineraries' => ['enabled' => true],
                'hotels' => ['enabled' => true],
                'activities' => ['enabled' => true],
                'transfers' => ['enabled' => true],
                'suppliers' => ['enabled' => true],
                'destinations' => ['enabled' => true],
                'email_templates' => ['enabled' => true],
                'gmail_integration' => ['enabled' => true],
                'whatsapp' => ['enabled' => true, 'limit' => 500],
                'campaigns' => ['enabled' => true, 'limit' => 10],
                'google_sheets_sync' => ['enabled' => true],
                'reports' => ['enabled' => true],
                'analytics' => ['enabled' => true],
                'performance_tracking' => ['enabled' => true],
                'targets' => ['enabled' => true],
                'expenses' => ['enabled' => true],
                'user_management' => ['enabled' => true],
                'permissions' => ['enabled' => true],
                'company_settings' => ['enabled' => true],
            ],
            'enterprise' => [
                // All features enabled, unlimited
                'leads_management' => ['enabled' => true],
                'leads_import_export' => ['enabled' => true],
                'followups' => ['enabled' => true],
                'payments' => ['enabled' => true],
                'itineraries' => ['enabled' => true],
                'day_itineraries' => ['enabled' => true],
                'hotels' => ['enabled' => true],
                'activities' => ['enabled' => true],
                'transfers' => ['enabled' => true],
                'suppliers' => ['enabled' => true],
                'destinations' => ['enabled' => true],
                'email_templates' => ['enabled' => true],
                'gmail_integration' => ['enabled' => true],
                'whatsapp' => ['enabled' => true], // Unlimited
                'campaigns' => ['enabled' => true], // Unlimited
                'google_sheets_sync' => ['enabled' => true],
                'reports' => ['enabled' => true],
                'analytics' => ['enabled' => true],
                'performance_tracking' => ['enabled' => true],
                'targets' => ['enabled' => true],
                'expenses' => ['enabled' => true],
                'user_management' => ['enabled' => true],
                'permissions' => ['enabled' => true],
                'company_settings' => ['enabled' => true],
                'api_access' => ['enabled' => true],
                'custom_domain' => ['enabled' => true],
                'white_label' => ['enabled' => true],
                'priority_support' => ['enabled' => true],
            ],
        ];

        $featuresToAssign = $planFeatures[$planSlug] ?? [];

        foreach ($availableFeatures as $key => $feature) {
            $featureConfig = $featuresToAssign[$key] ?? ['enabled' => false];
            
            SubscriptionPlanFeature::create([
                'subscription_plan_id' => $plan->id,
                'feature_key' => $key,
                'feature_name' => $feature['name'],
                'is_enabled' => $featureConfig['enabled'],
                'limit_value' => $featureConfig['limit'] ?? null,
            ]);
        }
    }
}

