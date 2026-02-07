<?php

use App\Http\Controllers\MarketingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Marketing Routes
|--------------------------------------------------------------------------
*/

// Marketing Dashboard - require authentication
Route::middleware('auth:sanctum')->prefix('marketing')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [MarketingController::class, 'dashboard']);
    
    // Client Groups
    Route::get('/client-groups', [MarketingController::class, 'clientGroups']);
    Route::post('/client-groups', [MarketingController::class, 'createClientGroup']);
    Route::get('/client-groups/{id}', [MarketingController::class, 'showClientGroup']);
    Route::put('/client-groups/{id}', [MarketingController::class, 'updateClientGroup']);
    Route::delete('/client-groups/{id}', [MarketingController::class, 'deleteClientGroup']);
    Route::post('/client-groups/{id}/add-clients', [MarketingController::class, 'addClientsToGroup']);
    Route::get('/client-groups/{id}/clients', [MarketingController::class, 'getGroupClients']);
    
    // Email Campaigns
    Route::get('/email-campaigns', [MarketingController::class, 'emailCampaigns']);
    Route::post('/email-campaigns', [MarketingController::class, 'createEmailCampaign']);
    Route::get('/email-campaigns/{id}', [MarketingController::class, 'showEmailCampaign']);
    Route::put('/email-campaigns/{id}', [MarketingController::class, 'updateEmailCampaign']);
    Route::delete('/email-campaigns/{id}', [MarketingController::class, 'deleteEmailCampaign']);
    Route::post('/email-campaigns/{id}/send', [MarketingController::class, 'sendEmailCampaign']);
    Route::post('/email-campaigns/{id}/duplicate', [MarketingController::class, 'duplicateEmailCampaign']);
    
    // SMS Campaigns
    Route::get('/sms-campaigns', [MarketingController::class, 'smsCampaigns']);
    Route::post('/sms-campaigns', [MarketingController::class, 'createSmsCampaign']);
    Route::get('/sms-campaigns/{id}', [MarketingController::class, 'showSmsCampaign']);
    Route::put('/sms-campaigns/{id}', [MarketingController::class, 'updateSmsCampaign']);
    Route::delete('/sms-campaigns/{id}', [MarketingController::class, 'deleteSmsCampaign']);
    Route::post('/sms-campaigns/{id}/send', [MarketingController::class, 'sendSmsCampaign']);
    Route::post('/sms-campaigns/{id}/duplicate', [MarketingController::class, 'duplicateSmsCampaign']);
    
    // Marketing Templates
    Route::get('/templates', [MarketingController::class, 'templates']);
    Route::post('/templates', [MarketingController::class, 'createTemplate']);
    Route::get('/templates/{id}', [MarketingController::class, 'showTemplate']);
    Route::put('/templates/{id}', [MarketingController::class, 'updateTemplate']);
    Route::delete('/templates/{id}', [MarketingController::class, 'deleteTemplate']);
    Route::post('/templates/{id}/preview', [MarketingController::class, 'previewTemplate']);
    Route::post('/templates/{id}/duplicate', [MarketingController::class, 'duplicateTemplate']);
    
    // Marketing Analytics
    Route::get('/analytics', [MarketingController::class, 'analytics']);
    Route::get('/analytics/overview', [MarketingController::class, 'analyticsOverview']);
    Route::get('/analytics/campaign-performance', [MarketingController::class, 'campaignPerformance']);
    Route::get('/analytics/engagement', [MarketingController::class, 'engagementAnalytics']);
    Route::get('/analytics/conversions', [MarketingController::class, 'conversionAnalytics']);
    Route::get('/analytics/roi', [MarketingController::class, 'roiAnalytics']);
    
    // Marketing Leads
    Route::get('/leads', [MarketingController::class, 'marketingLeads']);
    Route::post('/leads/{id}/add-to-campaign', [MarketingController::class, 'addLeadToCampaign']);
    Route::post('/leads/bulk-add-to-campaign', [MarketingController::class, 'bulkAddLeadsToCampaign']);
    
    // Campaign Management
    Route::get('/campaigns/active', [MarketingController::class, 'activeCampaigns']);
    Route::get('/campaigns/scheduled', [MarketingController::class, 'scheduledCampaigns']);
    Route::get('/campaigns/completed', [MarketingController::class, 'completedCampaigns']);
    Route::post('/campaigns/{id}/pause', [MarketingController::class, 'pauseCampaign']);
    Route::post('/campaigns/{id}/resume', [MarketingController::class, 'resumeCampaign']);
    Route::post('/campaigns/{id}/cancel', [MarketingController::class, 'cancelCampaign']);
    
    // Email Marketing Specific
    Route::get('/email/contacts', [MarketingController::class, 'emailContacts']);
    Route::post('/email/import-contacts', [MarketingController::class, 'importEmailContacts']);
    Route::post('/email/validate-contacts', [MarketingController::class, 'validateEmailContacts']);
    Route::get('/email/unsubscribe/{token}', [MarketingController::class, 'unsubscribeEmail']);
    Route::post('/email/track-open', [MarketingController::class, 'trackEmailOpen']);
    Route::post('/email/track-click', [MarketingController::class, 'trackEmailClick']);
    
    // SMS Marketing Specific
    Route::get('/sms/contacts', [MarketingController::class, 'smsContacts']);
    Route::post('/sms/import-contacts', [MarketingController::class, 'importSmsContacts']);
    Route::post('/sms/validate-contacts', [MarketingController::class, 'validateSmsContacts']);
    Route::post('/sms/track-delivery', [MarketingController::class, 'trackSmsDelivery']);
    Route::post('/sms/track-read', [MarketingController::class, 'trackSmsRead']);
    
    // WhatsApp Marketing
    Route::get('/whatsapp/campaigns', [MarketingController::class, 'whatsappCampaigns']);
    Route::post('/whatsapp/campaigns', [MarketingController::class, 'createWhatsappCampaign']);
    Route::post('/whatsapp/send-message', [MarketingController::class, 'sendWhatsappMessage']);
    Route::get('/whatsapp/templates', [MarketingController::class, 'whatsappTemplates']);
    Route::post('/whatsapp/upload-media', [MarketingController::class, 'uploadWhatsappMedia']);
    
    // Social Media Integration
    Route::get('/social-media/accounts', [MarketingController::class, 'socialMediaAccounts']);
    Route::post('/social-media/connect/{platform}', [MarketingController::class, 'connectSocialMedia']);
    Route::post('/social-media/post/{platform}', [MarketingController::class, 'postToSocialMedia']);
    Route::get('/social-media/analytics/{platform}', [MarketingController::class, 'socialMediaAnalytics']);
    
    // Marketing Automation
    Route::get('/automation/workflows', [MarketingController::class, 'automationWorkflows']);
    Route::post('/automation/workflows', [MarketingController::class, 'createAutomationWorkflow']);
    Route::put('/automation/workflows/{id}', [MarketingController::class, 'updateAutomationWorkflow']);
    Route::delete('/automation/workflows/{id}', [MarketingController::class, 'deleteAutomationWorkflow']);
    Route::post('/automation/workflows/{id}/activate', [MarketingController::class, 'activateWorkflow']);
    Route::post('/automation/workflows/{id}/deactivate', [MarketingController::class, 'deactivateWorkflow']);
    
    // A/B Testing
    Route::get('/ab-tests', [MarketingController::class, 'abTests']);
    Route::post('/ab-tests', [MarketingController::class, 'createAbTest']);
    Route::get('/ab-tests/{id}/results', [MarketingController::class, 'abTestResults']);
    Route::post('/ab-tests/{id}/conclude', [MarketingController::class, 'concludeAbTest']);
    
    // Landing Pages
    Route::get('/landing-pages', [MarketingController::class, 'landingPages']);
    Route::post('/landing-pages', [MarketingController::class, 'createLandingPage']);
    Route::get('/landing-pages/{id}', [MarketingController::class, 'getLandingPage'])->whereNumber('id');
    Route::put('/landing-pages/{id}', [MarketingController::class, 'updateLandingPage']);
    Route::delete('/landing-pages/{id}', [MarketingController::class, 'deleteLandingPage']);
    Route::post('/landing-pages/{id}/publish', [MarketingController::class, 'publishLandingPage']);
    Route::get('/landing-pages/{id}/preview', [MarketingController::class, 'previewLandingPage']);
    
    // Marketing Reports
    Route::get('/reports/campaign-summary', [MarketingController::class, 'campaignSummaryReport']);
    Route::get('/reports/lead-generation', [MarketingController::class, 'leadGenerationReport']);
    Route::get('/reports/roi-analysis', [MarketingController::class, 'roiAnalysisReport']);
    Route::get('/reports/export/{type}', [MarketingController::class, 'exportMarketingReport']);
});

// Public marketing routes (no authentication required)
Route::prefix('public/marketing')->group(function () {
    Route::get('/unsubscribe/{token}', [MarketingController::class, 'publicUnsubscribe']);
    Route::get('/landing-page/{slug}', [MarketingController::class, 'publicLandingPage']);
    Route::post('/track/email-open', [MarketingController::class, 'publicTrackEmailOpen']);
    Route::post('/track/email-click', [MarketingController::class, 'publicTrackEmailClick']);
    Route::post('/track/sms-delivery', [MarketingController::class, 'publicTrackSmsDelivery']);
});
