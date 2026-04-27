<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Check latest Email Campaign
$campaign = \App\Models\EmailCampaign::latest()->first();
if (!$campaign) {
    echo "No Email campaigns found.\n";
} else {
    echo "Email Campaign Name: " . $campaign->name . "\n";
    echo "Lead IDs: " . json_encode($campaign->lead_ids) . "\n";
    $leadIds = (array)$campaign->lead_ids;
    $leadsWithEmail = \App\Modules\Leads\Domain\Entities\Lead::whereIn('id', $leadIds)->whereNotNull('email')->count();
    echo "Leads with Email: " . $leadsWithEmail . "\n";
}

// Check Email Settings for the company
$companyId = 20; // As found before
$settings = \App\Models\Setting::where('company_id', $companyId)->get()->pluck('value', 'key');
$mailEnabled = \App\Services\CompanyMailSettingsService::getSettings();

echo "\n--- Mail Settings ---\n";
echo "Mail Enabled: " . ($mailEnabled['enabled'] ? 'YES' : 'NO') . "\n";
echo "From Name: " . ($mailEnabled['from_name'] ?: 'EMPTY') . "\n";
echo "From Address: " . ($mailEnabled['from_address'] ?: 'EMPTY') . "\n";

// Check if SMTP is configured globally if not per company
echo "\n--- Global Mail Config ---\n";
echo "Host: " . config('mail.mailers.smtp.host') . "\n";
echo "Port: " . config('mail.mailers.smtp.port') . "\n";
echo "User: " . config('mail.mailers.smtp.username') . "\n";
