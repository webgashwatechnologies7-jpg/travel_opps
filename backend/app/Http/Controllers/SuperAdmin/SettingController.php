<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::all();
        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
            'settings.*.type' => 'nullable|string'
        ]);

        foreach ($request->settings as $s) {
            Setting::setValue($s['key'], $s['value'], $s['type'] ?? 'string');
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully'
        ]);
    }

    public function getByKey($key): JsonResponse
    {
        $value = Setting::getValue($key);
        return response()->json([
            'success' => true,
            'key' => $key,
            'value' => $value
        ]);
    }
}
