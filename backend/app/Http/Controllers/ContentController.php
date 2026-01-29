<?php

namespace App\Http\Controllers;

use App\Models\Content;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContentController extends Controller
{
    /**
     * Get content: all or by keys.
     * GET /api/content
     * GET /api/content?keys=marketing.dashboard.title,common.view_more
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $keys = $request->input('keys');
            if ($keys !== null) {
                $keys = is_array($keys) ? $keys : array_map('trim', explode(',', $keys));
                $keys = array_filter($keys);
                $data = count($keys) > 0 ? Content::getMany($keys) : Content::getAll();
            } else {
                $data = Content::getAll();
            }

            return response()->json([
                'success' => true,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch content',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }

    /**
     * Update content (bulk).
     * PUT /api/content
     * Body: { "content": { "marketing.dashboard.title": "New Title", ... } }
     */
    public function update(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'content' => 'required|array',
                'content.*' => 'nullable|string',
            ]);

            $content = $request->input('content');
            foreach ($content as $key => $value) {
                if (!is_string($key)) {
                    continue;
                }
                $group = explode('.', $key)[0] ?? null;
                Content::setValue($key, $value === null ? '' : (string) $value, $group);
            }

            return response()->json([
                'success' => true,
                'message' => 'Content updated successfully',
                'data' => Content::getMany(array_keys($content)),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update content',
                'error' => config('app.debug') ? $e->getMessage() : null,
            ], 500);
        }
    }
}
