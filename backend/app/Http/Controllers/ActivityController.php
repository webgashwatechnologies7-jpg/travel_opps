<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Traits\StandardApiResponse;
use App\Traits\RequestSanitizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ActivityController extends Controller
{
    use StandardApiResponse, RequestSanitizer;
    /**
     * Get all activities.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $activities = Activity::with('creator')
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($activity) {
                    return [
                        'id' => $activity->id,
                        'name' => $activity->name,
                        'destination' => $activity->destination,
                        'activity_details' => $activity->activity_details,
                        'activity_photo' => $activity->activity_photo ? asset('storage/' . $activity->activity_photo) : null,
                        'status' => $activity->status,
                        'price_updates_count' => $activity->price_updates_count,
                        'created_by' => $activity->created_by,
                        'created_by_name' => $activity->creator ? $activity->creator->name : 'Travbizz Travel IT Solutions',
                        'last_update' => $activity->updated_at ? $activity->updated_at->format('d-m-Y') : null,
                        'updated_at' => $activity->updated_at,
                        'created_at' => $activity->created_at,
                    ];
                });

            return $this->successResponse($activities, 'Activities retrieved successfully');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('An error occurred while retrieving activities', $e);
        }
    }

    /**
     * Create a new activity.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate the request first
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'destination' => 'required|string|max:255',
                'activity_details' => 'nullable|string',
                'activity_photo' => 'nullable|image|max:2048',
                'status' => 'nullable|in:active,inactive',
            ], [
                'name.required' => 'The activity name field is required.',
                'destination.required' => 'The destination field is required.',
                'activity_photo.image' => 'The activity photo must be an image.',
                'activity_photo.max' => 'The activity photo must not be greater than 2MB.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Handle file upload after validation passes
            $activityPhotoPath = null;
            if ($request->hasFile('activity_photo')) {
                $file = $request->file('activity_photo');
                $activityPhotoPath = $file->store('activities', 'public');
            }

            $activity = Activity::create([
                'name' => $request->name,
                'destination' => $request->destination,
                'activity_details' => $request->activity_details,
                'activity_photo' => $activityPhotoPath,
                'status' => $request->status ?? 'active',
                'price_updates_count' => 0,
                'created_by' => $request->user()->id,
            ]);

            $activity->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Activity created successfully',
                'data' => [
                    'id' => $activity->id,
                    'name' => $activity->name,
                    'destination' => $activity->destination,
                    'activity_details' => $activity->activity_details,
                    'activity_photo' => $activity->activity_photo ? asset('storage/' . $activity->activity_photo) : null,
                    'status' => $activity->status,
                    'price_updates_count' => $activity->price_updates_count,
                    'created_by' => $activity->created_by,
                    'created_by_name' => $activity->creator ? $activity->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $activity->updated_at ? $activity->updated_at->format('d-m-Y') : null,
                    'updated_at' => $activity->updated_at,
                    'created_at' => $activity->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating activity',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific activity.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $activity = Activity::with('creator')->find($id);

            if (!$activity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Activity retrieved successfully',
                'data' => [
                    'id' => $activity->id,
                    'name' => $activity->name,
                    'destination' => $activity->destination,
                    'activity_details' => $activity->activity_details,
                    'activity_photo' => $activity->activity_photo ? asset('storage/' . $activity->activity_photo) : null,
                    'status' => $activity->status,
                    'price_updates_count' => $activity->price_updates_count,
                    'created_by' => $activity->created_by,
                    'created_by_name' => $activity->creator ? $activity->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $activity->updated_at ? $activity->updated_at->format('d-m-Y') : null,
                    'updated_at' => $activity->updated_at,
                    'created_at' => $activity->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving activity',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update an activity.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $activity = Activity::find($id);

            if (!$activity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found',
                ], 404);
            }

            // Handle file upload
            $activityPhotoPath = $activity->activity_photo;
            if ($request->hasFile('activity_photo')) {
                // Delete old photo if exists
                if ($activity->activity_photo && Storage::disk('public')->exists($activity->activity_photo)) {
                    Storage::disk('public')->delete($activity->activity_photo);
                }
                $file = $request->file('activity_photo');
                $activityPhotoPath = $file->store('activities', 'public');
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'destination' => 'sometimes|required|string|max:255',
                'activity_details' => 'nullable|string',
                'activity_photo' => 'nullable|image|max:2048',
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
                'name' => $request->has('name') ? $request->name : $activity->name,
                'destination' => $request->has('destination') ? $request->destination : $activity->destination,
                'activity_details' => $request->has('activity_details') ? $request->activity_details : $activity->activity_details,
                'activity_photo' => $activityPhotoPath,
                'status' => $request->has('status') ? $request->status : $activity->status,
            ];

            $activity->update($updateData);
            $activity->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Activity updated successfully',
                'data' => [
                    'id' => $activity->id,
                    'name' => $activity->name,
                    'destination' => $activity->destination,
                    'activity_details' => $activity->activity_details,
                    'activity_photo' => $activity->activity_photo ? asset('storage/' . $activity->activity_photo) : null,
                    'status' => $activity->status,
                    'price_updates_count' => $activity->price_updates_count,
                    'created_by' => $activity->created_by,
                    'created_by_name' => $activity->creator ? $activity->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $activity->updated_at ? $activity->updated_at->format('d-m-Y') : null,
                    'updated_at' => $activity->updated_at,
                    'created_at' => $activity->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating activity',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete an activity.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $activity = Activity::find($id);

            if (!$activity) {
                return response()->json([
                    'success' => false,
                    'message' => 'Activity not found',
                ], 404);
            }

            $activity->delete();

            return response()->json([
                'success' => true,
                'message' => 'Activity deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting activity',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Import activities from Excel file.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function import(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'nullable|mimes:xlsx,xls,csv|max:10240', // 10MB max
                'import_file' => 'nullable|mimes:xlsx,xls,csv|max:10240', // 10MB max
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

            if (!$request->hasFile('file') && !$request->hasFile('import_file')) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => [
                        'file' => ['Please select a file to import.'],
                    ],
                ], 422);
            }

            // Handle file import (CSV/Excel)
            $importedCount = 0;
            $errors = [];
            $file = $request->file('file') ?? $request->file('import_file');
            
            if ($file) {
                $filePath = $file->getPathname();
                
                try {
                    // Handle CSV file
                    if ($file->getClientOriginalExtension() === 'csv') {
                        $handle = fopen($filePath, 'r');
                        $header = fgetcsv($handle); // Skip header row
                        $lineNumber = 2; // First data row
                        
                        while (($row = fgetcsv($handle)) !== false) {
                            try {
                                $name = isset($row[0]) ? trim($row[0]) : '';
                                $destination = isset($row[1]) ? trim($row[1]) : '';
                                // According to the template/export, activity details are in the 6th column
                                $activityDetails = isset($row[5]) ? trim($row[5]) : '';

                                if ($name === '' || $destination === '') {
                                    $errors[] = "Row {$lineNumber}: Activity name and destination are required.";
                                    $lineNumber++;
                                    continue;
                                }

                                Activity::create([
                                    'name' => $name,
                                    'destination' => $destination,
                                    'activity_details' => $activityDetails,
                                    'status' => 'active',
                                    'created_by' => $request->user()->id,
                                    'company_id' => tenant('id'),
                                ]);
                                $importedCount++;
                            } catch (\Exception $e) {
                                $errors[] = "Row {$lineNumber}: " . $e->getMessage();
                            }
                            $lineNumber++;
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
                'message' => 'Activities imported successfully',
                'data' => [
                    'imported_count' => $importedCount,
                    'errors' => $errors,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while importing activities',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Export activities to Excel.
     *
     * @return StreamedResponse
     */
    public function export(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="activities_export_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8 to ensure Excel opens it correctly
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Add header row
            fputcsv($file, [
                'Activity Name',
                'Destination',
                'From Date',
                'To Date',
                'Price',
                'Activity Details',
                'Image Link'
            ]);
            
            // Get all activities with their prices
            $activities = Activity::with('prices')->get();
            
            foreach ($activities as $activity) {
                if ($activity->prices->count() > 0) {
                    // If activity has prices, create a row for each price
                    foreach ($activity->prices as $price) {
                        fputcsv($file, [
                            $activity->name,
                            $activity->destination,
                            $price->from_date->format('d-m-Y'),
                            $price->to_date->format('d-m-Y'),
                            $price->price ?? 0,
                            $activity->activity_details ?? '',
                            $activity->activity_photo ? asset('storage/' . $activity->activity_photo) : ''
                        ]);
                    }
                } else {
                    // If activity has no prices, create a single row with empty price fields
                    fputcsv($file, [
                        $activity->name,
                        $activity->destination,
                        '01-01-1970',
                        '01-01-1970',
                        0,
                        $activity->activity_details ?? '',
                        $activity->activity_photo ? asset('storage/' . $activity->activity_photo) : ''
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
            'Content-Disposition' => 'attachment; filename="activity_import_template.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8 to ensure Excel opens it correctly
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Add header row
            fputcsv($file, [
                'Activity Name',
                'Destination',
                'From Date',
                'To Date',
                'Price',
                'Activity Details',
                'Image Link'
            ]);
            
            // Add example row
            fputcsv($file, [
                'Activity name',
                'Destination',
                '01-01-1970',
                '01-01-1970',
                0,
                'Activity Details',
                'Image Link'
            ]);
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }
}

