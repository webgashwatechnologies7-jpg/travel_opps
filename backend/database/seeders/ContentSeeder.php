<?php

namespace Database\Seeders;

use App\Models\Content;
use Illuminate\Database\Seeder;

class ContentSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            // Marketing Dashboard
            ['key' => 'marketing.dashboard.title', 'value' => 'Marketing Dashboard', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.subtitle', 'value' => 'Manage your campaigns and track performance', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.search_placeholder', 'value' => 'Search campaigns...', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.time_filter', 'value' => 'This Month', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.new_campaign', 'value' => '+ New Campaign', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.card_campaigns', 'value' => 'Jan. Campaigns', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.card_leads', 'value' => 'Jan. Leads', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.card_emails', 'value' => 'Emails Sent', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.card_response', 'value' => 'Response Rate', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.start_marketing', 'value' => 'Start Marketing', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.customers', 'value' => 'Customers', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.plan_trip', 'value' => 'Plan a Trip', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.birthdays', 'value' => 'Birthdays', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.anniversaries', 'value' => 'Anniversaries', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.campaign_performance', 'value' => 'Campaign Performance', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.view_all', 'value' => 'View All', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.channel_performance', 'value' => 'Channel Performance', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.chart_placeholder', 'value' => 'Performance chart will appear here', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.channel_email', 'value' => 'Email', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.channel_sms', 'value' => 'SMS', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.channel_whatsapp', 'value' => 'WhatsApp', 'group' => 'marketing'],
            ['key' => 'marketing.dashboard.recent_campaigns', 'value' => 'Recent Campaigns', 'group' => 'marketing'],

            // Common
            ['key' => 'common.view_more', 'value' => 'View more', 'group' => 'common'],
            ['key' => 'common.view_all', 'value' => 'View All', 'group' => 'common'],
            ['key' => 'common.create', 'value' => 'Create', 'group' => 'common'],
            ['key' => 'common.save', 'value' => 'Save', 'group' => 'common'],
            ['key' => 'common.edit', 'value' => 'Edit', 'group' => 'common'],
            ['key' => 'common.delete', 'value' => 'Delete', 'group' => 'common'],
            ['key' => 'common.search', 'value' => 'Q Search', 'group' => 'common'],
            ['key' => 'common.filter', 'value' => 'Filter', 'group' => 'common'],
            ['key' => 'common.select', 'value' => 'Select', 'group' => 'common'],
            ['key' => 'common.flight_search', 'value' => 'Flight Search', 'group' => 'common'],
            ['key' => 'common.hotel_search', 'value' => 'Hotel Search', 'group' => 'common'],
            ['key' => 'common.refresh', 'value' => 'Refresh', 'group' => 'common'],
            ['key' => 'common.loading', 'value' => 'Loading...', 'group' => 'common'],
            ['key' => 'common.no_data', 'value' => 'No data available', 'group' => 'common'],
            ['key' => 'validation.required', 'value' => 'This field is required', 'group' => 'validation'],
            ['key' => 'validation.invalid_email', 'value' => 'Invalid email address', 'group' => 'validation'],

            // Settings (Phase 3)
            ['key' => 'settings.page_title', 'value' => 'Company Settings', 'group' => 'settings'],
            ['key' => 'settings.subtitle', 'value' => 'Customize your dashboard colors', 'group' => 'settings'],
            ['key' => 'settings.sidebar_color', 'value' => 'Sidebar Color', 'group' => 'settings'],
            ['key' => 'settings.dashboard_bg_color', 'value' => 'Dashboard Background Color', 'group' => 'settings'],
            ['key' => 'settings.header_bg_color', 'value' => 'Header Background Color', 'group' => 'settings'],
            ['key' => 'settings.save_settings', 'value' => 'Save Settings', 'group' => 'settings'],
            ['key' => 'settings.saving', 'value' => 'Saving...', 'group' => 'settings'],
            ['key' => 'settings.reset_to_default', 'value' => 'Reset to Default', 'group' => 'settings'],
            ['key' => 'settings.settings_updated', 'value' => 'Settings updated successfully!', 'group' => 'settings'],
            ['key' => 'settings.settings_reset', 'value' => 'Settings reset to default values!', 'group' => 'settings'],
            ['key' => 'settings.preview', 'value' => 'Preview', 'group' => 'settings'],
            ['key' => 'settings.sidebar', 'value' => 'Sidebar', 'group' => 'settings'],
            ['key' => 'settings.dashboard_and_header', 'value' => 'Dashboard & Header', 'group' => 'settings'],
            ['key' => 'settings.email_template_settings', 'value' => 'Email Template Settings', 'group' => 'settings'],
            ['key' => 'settings.manage_templates', 'value' => 'Manage Templates →', 'group' => 'settings'],
            ['key' => 'settings.email_template_help', 'value' => 'Select the email template to use when sending quotations to clients', 'group' => 'settings'],
            ['key' => 'settings.default_email_template', 'value' => 'Default Email Template', 'group' => 'settings'],
            ['key' => 'settings.template_used_for_quotations', 'value' => 'This template will be used when sending quotations via email', 'group' => 'settings'],
            ['key' => 'settings.email_template_updated', 'value' => 'Email template updated successfully!', 'group' => 'settings'],
            ['key' => 'settings.gmail_integration', 'value' => 'Gmail Integration', 'group' => 'settings'],
            ['key' => 'settings.gmail_help', 'value' => 'Connect your Gmail account to send and receive emails directly from the CRM.', 'group' => 'settings'],
            ['key' => 'settings.connected_as', 'value' => 'Connected as', 'group' => 'settings'],
            ['key' => 'settings.reconnect_account', 'value' => 'Reconnect Account', 'group' => 'settings'],
            ['key' => 'settings.connect_gmail', 'value' => 'Connect Gmail Account', 'group' => 'settings'],
            ['key' => 'settings.itinerary_settings', 'value' => 'Itinerary Settings', 'group' => 'settings'],
            ['key' => 'settings.itinerary_help', 'value' => 'Configure settings for itinerary management', 'group' => 'settings'],
            ['key' => 'settings.max_hotel_options', 'value' => 'Maximum Hotel Options Per Day', 'group' => 'settings'],
            ['key' => 'settings.max_hotel_help', 'value' => 'Set the maximum number of hotel options that can be added per day in an itinerary.', 'group' => 'settings'],
            ['key' => 'settings.options_per_day', 'value' => 'option(s) per day', 'group' => 'settings'],
            ['key' => 'settings.save_itinerary_settings', 'value' => 'Save Itinerary Settings', 'group' => 'settings'],
            ['key' => 'settings.itinerary_saved', 'value' => 'Itinerary settings saved successfully!', 'group' => 'settings'],
            ['key' => 'settings.no_permission', 'value' => 'You do not have permission to access this page. Admin access required.', 'group' => 'settings'],
            ['key' => 'settings.reset_confirm', 'value' => 'Are you sure you want to reset all settings to default values?', 'group' => 'settings'],
        ];

        foreach ($items as $item) {
            Content::updateOrCreate(
                ['key' => $item['key']],
                [
                    'value' => $item['value'],
                    'group' => $item['group'] ?? null,
                    'description' => null,
                ]
            );
        }
    }
}
