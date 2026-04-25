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
        $tenant = app()->bound('tenant') ? app('tenant') : null;

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

if (!function_exists('imageToBase64')) {
    /**
     * Convert an image path or URL to a base64 encoded string.
     * ONLY uses local file paths to prevent hanging.
     */
    function imageToBase64($path)
    {
        if (empty($path)) return null;

        try {
            // Extract path if it's a URL but pointing to our own domain
            $parsed = parse_url($path);
            $cleanPath = $parsed['path'] ?? $path;
            $cleanPath = ltrim($cleanPath, '/');

            // 1. Check public directory
            $fullPath = public_path($cleanPath);
            if (file_exists($fullPath) && is_file($fullPath)) {
                $content = file_get_contents($fullPath);
                $type = pathinfo($fullPath, PATHINFO_EXTENSION);
                return 'data:image/' . ($type ?: 'jpg') . ';base64,' . base64_encode($content);
            }

            // 2. Check storage app public directory
            if (strpos($cleanPath, 'storage/') === 0) {
                $innerPath = substr($cleanPath, 8);
                $storagePath = storage_path('app/public/' . $innerPath);
                if (file_exists($storagePath) && is_file($storagePath)) {
                    $content = file_get_contents($storagePath);
                    $type = pathinfo($storagePath, PATHINFO_EXTENSION);
                    return 'data:image/' . ($type ?: 'jpg') . ';base64,' . base64_encode($content);
                }
            }
            
            // 3. Fallback for common storage pattern
            $storagePublicPath = storage_path('app/public/' . ltrim($cleanPath, '/'));
            if (file_exists($storagePublicPath) && is_file($storagePublicPath)) {
                 $content = file_get_contents($storagePublicPath);
                 $type = pathinfo($storagePublicPath, PATHINFO_EXTENSION);
                 return 'data:image/' . ($type ?: 'jpg') . ';base64,' . base64_encode($content);
            }

        } catch (\Exception $e) {
            return null;
        }

        return null;
    }
}

if (!function_exists('numberToWords')) {
    /**
     * Convert a number to Indian currency words format.
     */
    function numberToWords($number)
    {
        $no = floor($number);
        $point = round($number - $no, 2) * 100;
        $hundred = null;
        $digits_1 = strlen($no);
        $i = 0;
        $str = array();
        $words = array(
            '0' => '', '1' => 'One', '2' => 'Two',
            '3' => 'Three', '4' => 'Four', '5' => 'Five', '6' => 'Six',
            '7' => 'Seven', '8' => 'Eight', '9' => 'Nine',
            '10' => 'Ten', '11' => 'Eleven', '12' => 'Twelve',
            '13' => 'Thirteen', '14' => 'Fourteen',
            '15' => 'Fifteen', '16' => 'Sixteen', '17' => 'Seventeen',
            '18' => 'Eighteen', '19' => 'Nineteen', '20' => 'Twenty',
            '30' => 'Thirty', '40' => 'Forty', '50' => 'Fifty',
            '60' => 'Sixty', '70' => 'Seventy',
            '80' => 'Eighty', '90' => 'Ninety'
        );
        $digits = array('', 'Hundred', 'Thousand', 'Lakh', 'Crore');
        while ($i < $digits_1) {
            $divider = ($i == 2) ? 10 : 100;
            $number = floor($no % $divider);
            $no = floor($no / $divider);
            $i += ($divider == 10) ? 1 : 2;
            if ($number) {
                $plural = (($counter = count($str)) && $number > 9) ? 's' : null;
                $hundred = ($counter == 1 && $str[0]) ? ' and ' : null;
                $str[] = ($number < 21) ? $words[$number] . " " . $digits[$counter] . $plural . " " . $hundred
                    : $words[floor($number / 10) * 10] . " " . $words[$number % 10] . " " . $digits[$counter] . $plural . " " . $hundred;
            } else $str[] = null;
        }
        $str = array_reverse($str);
        $result = implode('', $str);
        $points = ($point) ?
            "and " . $words[$point / 10] . " " . $words[$point = $point % 10] : '';

        if (empty($result)) {
            return "Zero";
        }

        return $result . "Rupees " . $points;
    }
}
