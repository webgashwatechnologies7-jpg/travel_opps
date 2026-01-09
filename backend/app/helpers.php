<?php

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

