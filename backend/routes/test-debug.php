<?php

use Illuminate\Support\Facades\Route;
use App\Models\Quotation;
use App\Models\User;
use App\Models\Company;
use Spatie\Permission\Models\Permission;
use App\Models\SubscriptionPlanFeature;
use Illuminate\Support\Facades\Log;

Route::get('/test-pdf-render/{id}', function ($id) {
    $quotation = Quotation::with('lead.company')->find($id);

    if (!$quotation) {
        return 'Quotation not found';
    }

    // Check what data we have
    $debug = [
        'has_itinerary' => !empty($quotation->itinerary),
        'has_custom_fields' => !empty($quotation->custom_fields),
        'has_hotel_options' => isset($quotation->custom_fields['hotel_options']),
        'itinerary_keys' => $quotation->itinerary ? array_keys($quotation->itinerary) : [],
        'custom_fields_keys' => $quotation->custom_fields ? array_keys($quotation->custom_fields) : [],
    ];

    return '<pre>' . print_r($debug, true) . '</pre>';
});

Route::get('/debug-permissions', function () {
    $out = [];
    $email = request()->query('email');

    if ($email) {
        $user = User::where('email', $email)->first();
    } else {
        $user = User::where('is_super_admin', false)->whereNotNull('company_id')->latest()->first();
    }

    if (!$user) {
        return ['error' => 'No suitable user found for debugging. Pass ?email=user@example.com'];
    }

    $out['user'] = [
        'name' => $user->name,
        'email' => $user->email,
        'id' => $user->id,
        'roles' => $user->getRoleNames(),
        'all_permissions_count' => $user->getAllPermissions()->count(),
        'all_permissions' => $user->getAllPermissions()->pluck('name'),
    ];

    if ($user->company) {
        $out['company'] = [
            'name' => $user->company->name,
            'plan' => $user->company->subscriptionPlan ? $user->company->subscriptionPlan->name : 'No Plan',
        ];
    }

    return $out;
});
