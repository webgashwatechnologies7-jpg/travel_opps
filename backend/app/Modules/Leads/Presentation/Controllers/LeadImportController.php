<?php

namespace App\Modules\Leads\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Leads\Domain\Interfaces\LeadRepositoryInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class LeadImportController extends Controller
{
    /**
     * @var LeadRepositoryInterface
     */
    protected LeadRepositoryInterface $leadRepository;

    /**
     * LeadImportController constructor.
     *
     * @param LeadRepositoryInterface $leadRepository
     */
    public function __construct(LeadRepositoryInterface $leadRepository)
    {
        $this->leadRepository = $leadRepository;
    }

    /**
     * Download CSV template for lead import.
     *
     * @return StreamedResponse
     */
    public function downloadTemplate(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="lead_import_template.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8 to ensure Excel opens it correctly
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Add header row
            fputcsv($file, [
                'Name',
                'Phone',
                'Destination',
                'Email'
            ]);
            
            // Add example row
            fputcsv($file, [
                'Mr. Paras Jaswal',
                '9805598988',
                'Shimla',
                'paras@example.com'
            ]);
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Import leads from CSV file.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function import(Request $request): JsonResponse
    {
        try {
            // Validate file upload
            $validator = Validator::make($request->all(), [
                'file' => 'required|file|mimes:csv,txt|max:10240', // 10MB max
            ], [
                'file.required' => 'CSV file is required.',
                'file.file' => 'The uploaded file is not valid.',
                'file.mimes' => 'The file must be a CSV file.',
                'file.max' => 'The file size must not exceed 10MB.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $file = $request->file('file');
            $filePath = $file->getRealPath();
            
            // Open and read CSV file
            $handle = fopen($filePath, 'r');
            
            if ($handle === false) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to read CSV file.',
                ], 400);
            }

            // Skip BOM if present
            $bom = fread($handle, 3);
            if ($bom !== chr(0xEF).chr(0xBB).chr(0xBF)) {
                rewind($handle);
            }

            // Read header row
            $header = fgetcsv($handle);
            
            if ($header === false) {
                fclose($handle);
                return response()->json([
                    'success' => false,
                    'message' => 'CSV file is empty or invalid.',
                ], 400);
            }

            // Normalize header (trim and lowercase)
            $header = array_map(function ($item) {
                return trim(strtolower($item));
            }, $header);

            // Expected columns (case-insensitive)
            $expectedColumns = ['name', 'phone', 'destination', 'email'];
            
            // Validate header columns - check if Name, Phone and Destination are present
            $requiredColumns = ['name', 'phone', 'destination'];
            $missingColumns = array_diff($requiredColumns, $header);
            if (!empty($missingColumns)) {
                fclose($handle);
                return response()->json([
                    'success' => false,
                    'message' => 'CSV file is missing required columns: ' . implode(', ', $missingColumns) . '. Required: Name, Phone, Destination.',
                ], 400);
            }

            $totalRows = 0;
            $successRows = 0;
            $failedRows = [];
            $createdBy = $request->user()->id;

            // Process each row
            while (($row = fgetcsv($handle)) !== false) {
                $totalRows++;
                
                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                // Map row data to associative array
                $rowData = [];
                foreach ($header as $index => $column) {
                    $rowData[$column] = isset($row[$index]) ? trim($row[$index]) : null;
                }

                // Map CSV columns to lead data structure
                $name = $rowData['name'] ?? ($rowData['client name'] ?? null);
                $phone = $rowData['phone'] ?? null;
                $destination = $rowData['destination'] ?? null;
                $email = $rowData['email'] ?? null;

                // Validate required fields
                if (empty($name) || empty($phone) || empty($destination)) {
                    $failedRows[] = [
                        'row' => $totalRows,
                        'data' => $rowData,
                        'errors' => ['Name, Phone and Destination are required fields.'],
                    ];
                    continue;
                }

                $leadData = [
                    'client_name' => $name,
                    'phone' => $phone,
                    'email' => $email,
                    'source' => 'excel_import', // Default source
                    'destination' => $destination,
                    'priority' => 'warm', // Default priority
                    'created_by' => $createdBy,
                    'company_id' => $request->user()->company_id, // Important for multi-tenancy
                    'status' => 'new',
                ];

                // Create lead
                try {
                    $this->leadRepository->create($leadData);
                    $successRows++;
                } catch (\Exception $e) {
                    $failedRows[] = [
                        'row' => $totalRows,
                        'data' => $rowData,
                        'errors' => ['Failed to create lead: ' . $e->getMessage()],
                    ];
                }
            }

            fclose($handle);

            return response()->json([
                'success' => true,
                'message' => 'Lead import completed',
                'data' => [
                    'total_rows' => $totalRows,
                    'success_rows' => $successRows,
                    'failed_rows' => count($failedRows),
                    'failed_details' => $failedRows,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while importing leads',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

