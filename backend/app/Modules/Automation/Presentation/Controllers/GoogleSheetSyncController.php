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

            $companyId = auth()->user()->company_id;

            if (!$companyId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company context not found. Please log in again.',
                ], 403);
            }

            // Get or create the connection for this company
            $connection = GoogleSheetConnection::firstOrNew(['company_id' => $companyId]);
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
            $companyId = auth()->user()->company_id;
            
            if (!$companyId) {
                return response()->json([
                    'success' => true,
                    'message' => 'No Google Sheet connection found (no company context)',
                    'data' => [
                        'connected' => false,
                        'sheet_url' => null,
                        'is_active' => false,
                        'last_synced_at' => null,
                    ],
                ], 200);
            }

            $connection = GoogleSheetConnection::where('company_id', $companyId)->first();

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

    /**
     * Trigger manual Google Sheet sync.
     *
     * @return JsonResponse
     */
    public function sync(): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;

            if (!$companyId) {
                return response()->json([
                    'success' => false,
                    'message' => 'Company context not found',
                ], 403);
            }

            // Trigger the Artisan command with company_id parameter
            \Illuminate\Support\Facades\Artisan::call('google-sheets:sync-leads', [
                '--company' => $companyId
            ]);
            
            $output = \Illuminate\Support\Facades\Artisan::output();

            // Parse output to check if any leads were actually imported
            // The command outputs: "Imported: X, Skipped: Y"
            $message = 'Google Sheet sync triggered successfully';
            $newLeadsCount = 0;

            if (preg_match('/Imported: (\d+)/', $output, $matches)) {
                $newLeadsCount = (int)$matches[1];
                if ($newLeadsCount > 0) {
                    $message = "Success! {$newLeadsCount} new lead(s) have been imported to your CRM.";
                } else {
                    $message = "Your CRM is already up-to-date. No new leads found in your Google Sheet.";
                }
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => [
                    'new_leads_count' => $newLeadsCount,
                    'synced_at' => now(),
                ],
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Google Sheet manual sync failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to sync Google Sheets',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

