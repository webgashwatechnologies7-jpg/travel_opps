<?php

use Illuminate\Support\Str;

if (!function_exists('tenant')) {
    /**
     * Get the current tenant (company).
     *
     * @param string|null $key
     * @return mixed
     */
    function tenant(?string $key = null)
    {
        $tenant = app('tenant');

        if (!$tenant) {
            return null;
        }

        if ($key === null) {
            return $tenant;
        }

        return $tenant->{$key} ?? null;
    }
}

if (!function_exists('normalize_phone_number')) {
    /**
     * Normalize phone numbers to last 10 digits.
     *
     * @param string|null $phone
     * @return string
     */
    function normalize_phone_number(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);
        if (!$digits) {
            return '';
        }

        if (Str::length($digits) > 10) {
            return substr($digits, -10);
        }

        return $digits;
    }
}

