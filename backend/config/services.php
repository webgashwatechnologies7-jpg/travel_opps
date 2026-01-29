<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
        'redirect_uri' => env('GOOGLE_REDIRECT_URI'),
    ],

    'fcm' => [
        'server_key' => env('FCM_SERVER_KEY'),
        'sender_id' => env('FCM_SENDER_ID'),
        'project_id' => env('FCM_PROJECT_ID'),
        'app_id' => env('FCM_APP_ID'),
        'api_key' => env('FCM_API_KEY'),
        'auth_domain' => env('FCM_AUTH_DOMAIN'),
        'storage_bucket' => env('FCM_STORAGE_BUCKET'),
    ],

    'whatsapp' => [
        'api_key' => env('WHATSAPP_API_KEY'),
        'base_url' => env('WHATSAPP_BASE_URL', 'https://graph.facebook.com/v18.0'),
        'phone_number_id' => env('WHATSAPP_PHONE_NUMBER_ID'),
        'webhook_secret' => env('WHATSAPP_WEBHOOK_SECRET'),
        'verify_token' => env('WHATSAPP_VERIFY_TOKEN'),
    ],

    'telephony' => [
        'provider' => env('CALL_PROVIDER'),
        'webhook_skip_signature' => env('CALL_WEBHOOK_SKIP_SIGNATURE', false),
        'twilio' => [
            'account_sid' => env('TWILIO_ACCOUNT_SID'),
            'auth_token' => env('TWILIO_AUTH_TOKEN'),
            'from_number' => env('TWILIO_FROM_NUMBER'),
            'default_twiml_url' => env('TWILIO_TWIML_URL'),
            'recording_enabled' => env('TWILIO_RECORDING_ENABLED', true),
        ],
        'exotel' => [
            'account_sid' => env('EXOTEL_ACCOUNT_SID'),
            'token' => env('EXOTEL_TOKEN'),
            'from_number' => env('EXOTEL_FROM_NUMBER'),
            'subdomain' => env('EXOTEL_SUBDOMAIN', 'api.exotel.com'),
            'webhook_secret' => env('EXOTEL_WEBHOOK_SECRET'),
        ],
    ],


];
