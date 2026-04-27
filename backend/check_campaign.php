<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$campaign = \App\Models\WhatsAppCampaign::latest()->first();
if (!$campaign) {
    echo "No campaigns found.\n";
    exit;
}

echo "Campaign Name: " . $campaign->name . "\n";
echo "Lead IDs: " . json_encode($campaign->lead_ids) . "\n";

$leadIds = (array)$campaign->lead_ids;
$leadsWithPhone = \App\Modules\Leads\Domain\Entities\Lead::whereIn('id', $leadIds)->whereNotNull('phone')->get();

echo "Leads with Phone: " . $leadsWithPhone->count() . "\n";

foreach ($leadsWithPhone as $lead) {
    echo "Lead ID: " . $lead->id . " | Phone: " . $lead->phone . "\n";
}

$company = $campaign->company;
echo "Company ID: " . $campaign->company_id . "\n";
echo "WhatsApp Phone Number ID (Instance ID): " . ($company->whatsapp_phone_number_id ?: 'EMPTY') . "\n";
echo "WhatsApp API Key (Token): " . ($company->whatsapp_api_key ?: 'EMPTY') . "\n";
