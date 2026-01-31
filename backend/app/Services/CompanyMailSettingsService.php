<?php

namespace App\Services;

use App\Models\Company;
use App\Models\Setting;
use Illuminate\Support\Facades\Auth;

class CompanyMailSettingsService
{
    private const KEYS = [
        'enabled',
        'mailer',
        'host',
        'port',
        'encryption',
        'username',
        'password',
        'from_address',
        'from_name',
    ];

    public static function getCompanyId(): ?int
    {
        $user = Auth::user();
        if ($user && $user->company_id) {
            return (int) $user->company_id;
        }

        if (function_exists('tenant')) {
            $tenant = tenant();
            if ($tenant && isset($tenant->id)) {
                return (int) $tenant->id;
            }
        }

        // Fallback for Super Admin (company_id null): use first active company so mail settings work
        $first = Company::where('status', 'active')->orderBy('id')->value('id');
        if ($first) {
            return (int) $first;
        }

        return null;
    }

    public static function getSettings(?int $companyId = null): array
    {
        $companyId = $companyId ?? self::getCompanyId();
        if (!$companyId) {
            return [];
        }

        $settings = [];
        foreach (self::KEYS as $key) {
            $settings[$key] = Setting::getValue(self::buildKey($companyId, $key));
        }

        return $settings;
    }

    public static function saveSettings(array $data, ?int $companyId = null): array
    {
        $companyId = $companyId ?? self::getCompanyId();
        if (!$companyId) {
            return [];
        }

        foreach (self::KEYS as $key) {
            if (!array_key_exists($key, $data)) {
                continue;
            }

            $value = $data[$key];
            // Gmail App Password is often pasted with spaces; SMTP expects no spaces
            if ($key === 'password' && is_string($value)) {
                $value = str_replace(' ', '', $value);
            }

            $type = $key === 'enabled' ? 'boolean' : 'string';
            Setting::setValue(self::buildKey($companyId, $key), $value, $type, 'Company mail setting');
        }

        return self::getSettings($companyId);
    }

    public static function applyIfEnabled(?int $companyId = null): array
    {
        $settings = self::getSettings($companyId);
        if (empty($settings)) {
            return [];
        }

        if (!filter_var($settings['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN)) {
            return [];
        }

        return self::applySettings($settings);
    }

    public static function applySettings(array $settings): array
    {
        $mailer = $settings['mailer'] ?: 'smtp';
        $host = $settings['host'] ?? null;

        if ($mailer === 'smtp' && !$host) {
            return [];
        }

        if ($mailer === 'smtp') {
            // Gmail App Password is shown with spaces (e.g. "cklv kjhj jqsf ziqi") but SMTP expects no spaces
            $password = ($settings['password'] ?? null) ?: null;
            if ($password !== null && $password !== '') {
                $password = str_replace(' ', '', $password);
            }

            $smtpConfig = array_merge(config('mail.mailers.smtp', []), [
                'transport' => 'smtp',
                'host' => $host,
                'port' => (int) ($settings['port'] ?? 587),
                'encryption' => ($settings['encryption'] ?? null) ?: null,
                'username' => ($settings['username'] ?? null) ?: null,
                'password' => $password,
                'timeout' => null,
                'local_domain' => config('mail.mailers.smtp.local_domain'),
            ]);

            // When MAIL_VERIFY_PEER=false: fix "Peer certificate CN did not match expected CN" on live (Symfony Mailer reads verify_peer from Dsn options)
            $smtpConfig['verify_peer'] = filter_var(env('MAIL_VERIFY_PEER', 'true'), FILTER_VALIDATE_BOOLEAN);

            config(['mail.mailers.smtp' => $smtpConfig]);
        }

        config(['mail.default' => $mailer]);

        if (!empty($settings['from_address'])) {
            config(['mail.from.address' => $settings['from_address']]);
        }
        if (!empty($settings['from_name'])) {
            config(['mail.from.name' => $settings['from_name']]);
        }

        return $settings;
    }

    private static function buildKey(int $companyId, string $key): string
    {
        return "company:{$companyId}:mail_{$key}";
    }
}
