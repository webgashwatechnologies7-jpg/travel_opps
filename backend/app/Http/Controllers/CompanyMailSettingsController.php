<?php

namespace App\Http\Controllers;

use App\Models\CompanySettings;
use App\Services\CompanyMailSettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Validator;

class CompanyMailSettingsController extends Controller
{
    public function show(): JsonResponse
    {
        try {
            $settings = CompanyMailSettingsService::getSettings();

            return response()->json([
                'success' => true,
                'data' => [
                    'enabled' => filter_var($settings['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
                    'mailer' => $settings['mailer'] ?? 'smtp',
                    'host' => $settings['host'] ?? '',
                    'port' => $settings['port'] ?? '',
                    'encryption' => $settings['encryption'] ?? '',
                    'username' => $settings['username'] ?? '',
                    'password' => (string) ($settings['password'] ?? ''),
                    'has_password' => !empty($settings['password']),
                    'from_address' => $settings['from_address'] ?? config('mail.from.address'),
                    'from_name' => $settings['from_name'] ?? config('mail.from.name'),
                ],
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to load mail settings: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'enabled' => 'nullable|boolean',
            'mailer' => 'nullable|in:smtp',
            'host' => 'nullable|string|max:255',
            'port' => 'nullable|integer|min:1|max:65535',
            'encryption' => 'nullable|in:tls,ssl',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'from_address' => 'nullable|email',
            'from_name' => 'nullable|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = array_filter($request->only([
            'enabled',
            'mailer',
            'host',
            'port',
            'encryption',
            'username',
            'password',
            'from_address',
            'from_name',
        ]), static function ($value) {
            return $value !== null;
        });

        $settings = CompanyMailSettingsService::saveSettings($payload);

        // Update integration flag for company (used for reports / quick checks)
        $companyId = CompanyMailSettingsService::getCompanyId();
        if ($companyId && Schema::hasColumn('company_settings', 'email_integration_enabled')) {
            $enabled = filter_var($settings['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);
            CompanySettings::where('company_id', $companyId)->update(['email_integration_enabled' => $enabled]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Mail settings updated',
            'data' => [
                'enabled' => filter_var($settings['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN),
                'mailer' => $settings['mailer'] ?? 'smtp',
                'host' => $settings['host'] ?? '',
                'port' => $settings['port'] ?? '',
                'encryption' => $settings['encryption'] ?? '',
                'username' => $settings['username'] ?? '',
                'password' => (string) ($settings['password'] ?? ''),
                'has_password' => !empty($settings['password']),
                'from_address' => $settings['from_address'] ?? config('mail.from.address'),
                'from_name' => $settings['from_name'] ?? config('mail.from.name'),
            ],
        ]);
    }

    public function test(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'to' => 'required|email',
                'enabled' => 'nullable|boolean',
                'mailer' => 'nullable|in:smtp',
                'host' => 'nullable|string|max:255',
                'port' => 'nullable|integer|min:1|max:65535',
                'encryption' => 'nullable|in:tls,ssl',
                'username' => 'nullable|string|max:255',
                'password' => 'nullable|string|max:255',
                'from_address' => 'nullable|email',
                'from_name' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $settings = CompanyMailSettingsService::getSettings();
            $overrides = array_filter($request->only([
                'enabled',
                'mailer',
                'host',
                'port',
                'encryption',
                'username',
                'password',
                'from_address',
                'from_name',
            ]), static function ($value) {
                return $value !== null;
            });

            $settings = array_merge($settings, $overrides);
            CompanyMailSettingsService::applySettings($settings);

            $errors = [];
            $checks = [];
            $mailer = $settings['mailer'] ?? 'smtp';
            $transport = $mailer;

            if ($mailer === 'smtp') {
                $host = $settings['host'] ?? null;
                $port = $settings['port'] ?? null;

                if (!$host) {
                    $errors[] = 'SMTP host is not configured.';
                }
                if (!$port) {
                    $errors[] = 'SMTP port is not configured.';
                }

                if ($host && $port) {
                    $timeout = 5;
                    $connection = @fsockopen($host, (int) $port, $errno, $errstr, $timeout);
                    if ($connection) {
                        fclose($connection);
                        $checks[] = "SMTP connection OK ({$host}:{$port}).";
                    } else {
                        $errors[] = "SMTP connection failed: {$errstr} ({$errno}).";
                    }
                }
            }

            if (empty($errors)) {
                try {
                    $fromAddress = $settings['from_address'] ?? config('mail.from.address');
                    $fromName = $settings['from_name'] ?? config('mail.from.name');

                    Mail::raw('Mail test from ' . config('app.name', 'TravelOps'), function ($message) use ($request, $fromAddress, $fromName) {
                        if ($fromAddress) {
                            $message->from($fromAddress, $fromName ?: null);
                        }
                        $message->to($request->to)
                            ->subject('Mail Test');
                    });
                    $checks[] = "Test email sent to {$request->to}.";
                } catch (\Throwable $e) {
                    $errors[] = 'Failed to send test email: ' . $e->getMessage();
                }
            }

            $success = empty($errors);
            $message = $success ? 'Mail is working.' : 'Mail is not working.';
            if (!empty($errors)) {
                $message = implode(' ', $errors);
            }

            return response()->json([
                'success' => $success,
                'message' => $message,
                'data' => [
                    'mailer' => $mailer,
                    'transport' => $transport,
                    'to' => $request->to,
                    'checks' => $checks,
                    'errors' => $errors,
                ],
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Mail test error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'data' => [
                    'errors' => [$e->getMessage()],
                ],
            ], 500);
        }
    }
}
