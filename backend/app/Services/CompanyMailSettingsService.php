<?php

namespace App\Services;

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
            $tenantId = tenant('id');
            if ($tenantId) {
                return (int) $tenantId;
            }
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

            $type = $key === 'enabled' ? 'boolean' : 'string';
            Setting::setValue(self::buildKey($companyId, $key), $data[$key], $type, 'Company mail setting');
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
            $smtpConfig = array_merge(config('mail.mailers.smtp', []), [
                'transport' => 'smtp',
                'host' => $host,
                'port' => (int) ($settings['port'] ?? 587),
                'encryption' => ($settings['encryption'] ?? null) ?: null,
                'username' => ($settings['username'] ?? null) ?: null,
                'password' => ($settings['password'] ?? null) ?: null,
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
