<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransferController extends Controller
{
    /**
     * Get all transfers.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $transfers = Transfer::with('creator')
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($transfer) {
                    return [
                        'id' => $transfer->id,
                        'name' => $transfer->name,
                        'destination' => $transfer->destination,
                        'transfer_details' => $transfer->transfer_details,
                        'transfer_photo' => $transfer->transfer_photo ? asset('storage/' . $transfer->transfer_photo) : null,
                        'status' => $transfer->status,
                        'price_updates_count' => $transfer->price_updates_count,
                        'created_by' => $transfer->created_by,
                        'created_by_name' => $transfer->creator ? $transfer->creator->name : 'Travbizz Travel IT Solutions',
                        'last_update' => $transfer->updated_at ? $transfer->updated_at->format('d-m-Y') : null,
                        'updated_at' => $transfer->updated_at,
                        'created_at' => $transfer->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Transfers retrieved successfully',
                'data' => $transfers,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving transfers',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new transfer.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Handle file upload
            $transferPhotoPath = null;
            if ($request->hasFile('transfer_photo')) {
                $file = $request->file('transfer_photo');
                $transferPhotoPath = $file->store('transfers', 'public');
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'destination' => 'required|string|max:255',
                'transfer_details' => 'nullable|string',
                'transfer_photo' => 'nullable|image|max:2048',
                'status' => 'nullable|in:active,inactive',
            ], [
                'name.required' => 'The transfer name field is required.',
                'destination.required' => 'The destination field is required.',
                'transfer_photo.image' => 'The transfer photo must be an image.',
                'transfer_photo.max' => 'The transfer photo must not be greater than 2MB.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $transfer = Transfer::create([
                'name' => $request->name,
                'destination' => $request->destination,
                'transfer_details' => $request->transfer_details,
                'transfer_photo' => $transferPhotoPath,
                'status' => $request->status ?? 'active',
                'price_updates_count' => 0,
                'created_by' => $request->user()->id,
            ]);

            $transfer->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Transfer created successfully',
                'data' => [
                    'id' => $transfer->id,
                    'name' => $transfer->name,
                    'destination' => $transfer->destination,
                    'transfer_details' => $transfer->transfer_details,
                    'transfer_photo' => $transfer->transfer_photo ? asset('storage/' . $transfer->transfer_photo) : null,
                    'status' => $transfer->status,
                    'price_updates_count' => $transfer->price_updates_count,
                    'created_by' => $transfer->created_by,
                    'created_by_name' => $transfer->creator ? $transfer->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $transfer->updated_at ? $transfer->updated_at->format('d-m-Y') : null,
                    'updated_at' => $transfer->updated_at,
                    'created_at' => $transfer->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating transfer',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific transfer.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $transfer = Transfer::with('creator')->find($id);

            if (!$transfer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Transfer retrieved successfully',
                'data' => [
                    'id' => $transfer->id,
                    'name' => $transfer->name,
                    'destination' => $transfer->destination,
                    'transfer_details' => $transfer->transfer_details,
                    'transfer_photo' => $transfer->transfer_photo ? asset('storage/' . $transfer->transfer_photo) : null,
                    'status' => $transfer->status,
                    'price_updates_count' => $transfer->price_updates_count,
                    'created_by' => $transfer->created_by,
                    'created_by_name' => $transfer->creator ? $transfer->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $transfer->updated_at ? $transfer->updated_at->format('d-m-Y') : null,
                    'updated_at' => $transfer->updated_at,
                    'created_at' => $transfer->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving transfer',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a transfer.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $transfer = Transfer::find($id);

            if (!$transfer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer not found',
                ], 404);
            }

            // Handle file upload
            $transferPhotoPath = $transfer->transfer_photo;
            if ($request->hasFile('transfer_photo')) {
                // Delete old photo if exists
                if ($transfer->transfer_photo && Storage::disk('public')->exists($transfer->transfer_photo)) {
                    Storage::disk('public')->delete($transfer->transfer_photo);
                }
                $file = $request->file('transfer_photo');
                $transferPhotoPath = $file->store('transfers', 'public');
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'destination' => 'sometimes|required|string|max:255',
                'transfer_details' => 'nullable|string',
                'transfer_photo' => 'nullable|image|max:2048',
                'status' => 'sometimes|in:active,inactive',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $updateData = [
                'name' => $request->has('name') ? $request->name : $transfer->name,
                'destination' => $request->has('destination') ? $request->destination : $transfer->destination,
                'transfer_details' => $request->has('transfer_details') ? $request->transfer_details : $transfer->transfer_details,
                'transfer_photo' => $transferPhotoPath,
                'status' => $request->has('status') ? $request->status : $transfer->status,
            ];

            $transfer->update($updateData);
            $transfer->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Transfer updated successfully',
                'data' => [
                    'id' => $transfer->id,
                    'name' => $transfer->name,
                    'destination' => $transfer->destination,
                    'transfer_details' => $transfer->transfer_details,
                    'transfer_photo' => $transfer->transfer_photo ? asset('storage/' . $transfer->transfer_photo) : null,
                    'status' => $transfer->status,
                    'price_updates_count' => $transfer->price_updates_count,
                    'created_by' => $transfer->created_by,
                    'created_by_name' => $transfer->creator ? $transfer->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $transfer->updated_at ? $transfer->updated_at->format('d-m-Y') : null,
                    'updated_at' => $transfer->updated_at,
                    'created_at' => $transfer->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating transfer',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a transfer.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $transfer = Transfer::find($id);

            if (!$transfer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Transfer not found',
                ], 404);
            }

            // Delete photo if exists
            if ($transfer->transfer_photo && Storage::disk('public')->exists($transfer->transfer_photo)) {
                Storage::disk('public')->delete($transfer->transfer_photo);
            }

            $transfer->delete();

            return response()->json([
                'success' => true,
                'message' => 'Transfer deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting transfer',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Import transfers from Excel file.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function import(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|mimes:xlsx,xls,csv|max:10240', // 10MB max
            ], [
                'file.required' => 'Please select a file to import.',
                'file.mimes' => 'The file must be a valid Excel file (xlsx, xls, csv).',
                'file.max' => 'The file size must not exceed 10MB.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Handle file import (CSV/Excel)
            $importedCount = 0;
            $errors = [];
            
            if ($request->hasFile('import_file')) {
                $file = $request->file('import_file');
                $filePath = $file->getPathname();
                
                try {
                    // Handle CSV file
                    if ($file->getClientOriginalExtension() === 'csv') {
                        $handle = fopen($filePath, 'r');
                        $header = fgetcsv($handle); // Skip header row
                        
                        while (($row = fgetcsv($handle)) !== false) {
                            try {
                                $transfer = Transfer::create([
                                    'name' => $row[0] ?? '',
                                    'destination' => $row[1] ?? '',
                                    'from_date' => $row[2] ?? null,
                                    'to_date' => $row[3] ?? null,
                                    'transfer_details' => $row[4] ?? '',
                                    'transfer_image' => $row[5] ?? '',
                                    'status' => $row[6] ?? 'active',
                                    'created_by' => $request->user()->id,
                                    'company_id' => tenant('id'),
                                ]);
                                
                                // Add price if provided
                                if (!empty($row[7])) {
                                    $transfer->prices()->create([
                                        'vehicle_type' => $row[8] ?? 'Standard',
                                        'price' => $row[7],
                                        'capacity' => $row[9] ?? 4,
                                        'company_id' => tenant('id'),
                                    ]);
                                }
                                
                                $importedCount++;
                            } catch (\Exception $e) {
                                $errors[] = "Row " . ($importedCount + 2) . ": " . $e->getMessage();
                            }
                        }
                        fclose($handle);
                    }
                    // For Excel files, would need PhpSpreadsheet library
                    else {
                        return response()->json([
                            'success' => false,
                            'message' => 'Excel files require PhpSpreadsheet library. Please use CSV format or install PhpSpreadsheet.',
                        ], 422);
                    }
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Error processing file: ' . $e->getMessage(),
                    ], 500);
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Transfers imported successfully',
                'data' => [
                    'imported_count' => $importedCount,
                    'errors' => $errors,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while importing transfers',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Export transfers to Excel.
     *
     * @return StreamedResponse
     */
    public function export(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="transfers_export_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8 to ensure Excel opens it correctly
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Add header row
            fputcsv($file, [
                'Transfer Name',
                'Destination',
                'From Date',
                'To Date',
                'Price',
                'Transfer Details',
                'Image Link'
            ]);
            
            // Get all transfers with their prices
            $transfers = Transfer::with('prices')->get();
            
            foreach ($transfers as $transfer) {
                if ($transfer->prices->count() > 0) {
                    // If transfer has prices, create a row for each price
                    foreach ($transfer->prices as $price) {
                        fputcsv($file, [
                            $transfer->name,
                            $transfer->destination,
                            $price->from_date->format('d-m-Y'),
                            $price->to_date->format('d-m-Y'),
                            $price->price ?? 0,
                            $transfer->transfer_details ?? '',
                            $transfer->transfer_photo ? asset('storage/' . $transfer->transfer_photo) : ''
                        ]);
                    }
                } else {
                    // If transfer has no prices, create a single row with empty price fields
                    fputcsv($file, [
                        $transfer->name,
                        $transfer->destination,
                        '01-01-1970',
                        '01-01-1970',
                        0,
                        $transfer->transfer_details ?? '',
                        $transfer->transfer_photo ? asset('storage/' . $transfer->transfer_photo) : ''
                    ]);
                }
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Download import template Excel file.
     *
     * @return StreamedResponse
     */
    public function downloadTemplate(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="transfer_import_template.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8 to ensure Excel opens it correctly
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Add header row
            fputcsv($file, [
                'Transfer Name',
                'Destination',
                'From Date',
                'To Date',
                'Price',
                'Transfer Details',
                'Image Link'
            ]);
            
            // Add example row
            fputcsv($file, [
                'Transfer name',
                'Destination',
                '01-01-1970',
                '01-01-1970',
                0,
                'Transfer Details',
                'Image Link'
            ]);
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

