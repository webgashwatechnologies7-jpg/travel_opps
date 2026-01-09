<?php

namespace App\Modules\Automation\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Automation\Domain\Entities\GoogleSheetConnection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class GoogleSheetSyncController extends Controller
{
    /**
     * Connect or update Google Sheet connection.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function connect(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'sheet_url' => 'required|url',
                'is_active' => 'required|boolean',
            ], [
                'sheet_url.required' => 'The sheet_url field is required.',
                'sheet_url.url' => 'The sheet_url must be a valid URL.',
                'is_active.required' => 'The is_active field is required.',
                'is_active.boolean' => 'The is_active field must be true or false.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Get or create the connection (assuming single connection for now)
            $connection = GoogleSheetConnection::firstOrNew([]);
            $connection->sheet_url = $request->input('sheet_url');
            $connection->is_active = $request->boolean('is_active');
            $connection->save();

            return response()->json([
                'success' => true,
                'message' => 'Google Sheet connection saved successfully',
                'data' => [
                    'connection' => [
                        'id' => $connection->id,
                        'sheet_url' => $connection->sheet_url,
                        'is_active' => $connection->is_active,
                        'last_synced_at' => $connection->last_synced_at,
                        'created_at' => $connection->created_at,
                        'updated_at' => $connection->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while saving Google Sheet connection',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get Google Sheet connection status.
     *
     * @return JsonResponse
     */
    public function status(): JsonResponse
    {
        try {
            $connection = GoogleSheetConnection::first();

            if (!$connection) {
                return response()->json([
                    'success' => true,
                    'message' => 'No Google Sheet connection found',
                    'data' => [
                        'connected' => false,
                        'sheet_url' => null,
                        'is_active' => false,
                        'last_synced_at' => null,
                    ],
                ], 200);
            }

            return response()->json([
                'success' => true,
                'message' => 'Google Sheet connection status retrieved successfully',
                'data' => [
                    'connected' => true,
                    'sheet_url' => $connection->sheet_url,
                    'is_active' => $connection->is_active,
                    'last_synced_at' => $connection->last_synced_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving Google Sheet connection status',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

