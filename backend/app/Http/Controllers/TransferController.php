<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use App\Services\FileUploadService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TransferController extends Controller
{
    protected FileUploadService $fileUploadService;

    public function __construct(FileUploadService $fileUploadService)
    {
        $this->fileUploadService = $fileUploadService;
    }

    // ─── CRUD ────────────────────────────────────────────────────────────────────

    /**
     * List all transfers.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $transfers = Transfer::orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($t) => $this->formatTransfer($t));

            return $this->successResponse($transfers, 'Transfers retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve transfers', $e);
        }
    }

    /**
     * Create a new transfer.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'destination' => 'required|string|max:255',
                'transfer_details' => 'nullable|string',
                'transfer_photo' => 'nullable|image|max:2048',
                'status' => 'nullable|in:active,inactive',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $photoPath = $request->hasFile('transfer_photo')
                ? $this->fileUploadService->upload($request->file('transfer_photo'), 'transfers')
                : null;

            $transfer = Transfer::create([
                'name' => $request->name,
                'destination' => $request->destination,
                'transfer_details' => $request->transfer_details,
                'transfer_photo' => $photoPath,
                'status' => $request->status ?? 'active',
                'price_updates_count' => 0,
                'created_by' => auth()->id(),
            ]);

            return $this->createdResponse($this->formatTransfer($transfer->refresh()), 'Transfer created successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create transfer', $e);
        }
    }

    /**
     * Get a single transfer.
     */
    public function show(int $id): JsonResponse
    {
        try {
            $transfer = Transfer::find($id);

            if (!$transfer) {
                return $this->notFoundResponse('Transfer not found');
            }

            return $this->successResponse($this->formatTransfer($transfer), 'Transfer retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve transfer', $e);
        }
    }

    /**
     * Update a transfer.
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $transfer = Transfer::find($id);

            if (!$transfer) {
                return $this->notFoundResponse('Transfer not found');
            }

            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'destination' => 'sometimes|required|string|max:255',
                'transfer_details' => 'nullable|string',
                'transfer_photo' => 'nullable|image|max:2048',
                'status' => 'sometimes|in:active,inactive',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $data = $request->only(['name', 'destination', 'transfer_details', 'status']);

            if ($request->hasFile('transfer_photo')) {
                $data['transfer_photo'] = $this->fileUploadService->update(
                    $request->file('transfer_photo'),
                    $transfer->transfer_photo,
                    'transfers'
                );
            }

            $transfer->update($data);

            return $this->updatedResponse($this->formatTransfer($transfer->refresh()), 'Transfer updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to update transfer', $e);
        }
    }

    /**
     * Delete a transfer.
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $transfer = Transfer::find($id);

            if (!$transfer) {
                return $this->notFoundResponse('Transfer not found');
            }

            $this->fileUploadService->delete($transfer->transfer_photo);
            $transfer->delete();

            return $this->deletedResponse('Transfer deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to delete transfer', $e);
        }
    }

    // ─── Import / Export ─────────────────────────────────────────────────────────

    /**
     * Import transfers from a CSV/Excel file.
     */
    public function import(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|mimes:xlsx,xls,csv|max:10240',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $file = $request->file('file');

            if (!$file->isValid()) {
                return $this->validationErrorResponse(null, 'Invalid file upload: ' . $file->getErrorMessage());
            }

            [$importedCount, $errors] = $this->processImportFile($file);

            return $this->successResponse(
                ['imported_count' => $importedCount, 'errors' => $errors],
                'Transfers imported successfully'
            );
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to import transfers', $e);
        }
    }

    /**
     * Export transfers as a CSV file.
     */
    public function export(): StreamedResponse
    {
        return response()->stream(function () {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($file, ['Transfer Name', 'Destination', 'From Date', 'To Date', 'Price', 'Transfer Details', 'Image Link']);

            Transfer::with('prices')->chunk(100, function ($transfers) use ($file) {
                foreach ($transfers as $transfer) {
                    if ($transfer->prices->count() > 0) {
                        foreach ($transfer->prices as $price) {
                            fputcsv($file, [
                                $transfer->name,
                                $transfer->destination,
                                optional($price->from_date)->format('d-m-Y') ?? '01-01-1970',
                                optional($price->to_date)->format('d-m-Y') ?? '01-01-1970',
                                $price->price ?? 0,
                                $transfer->transfer_details ?? '',
                                $transfer->transfer_photo ? asset('storage/' . $transfer->transfer_photo) : '',
                            ]);
                        }
                    } else {
                        fputcsv($file, [
                            $transfer->name,
                            $transfer->destination,
                            '01-01-1970',
                            '01-01-1970',
                            0,
                            $transfer->transfer_details ?? '',
                            $transfer->transfer_photo ? asset('storage/' . $transfer->transfer_photo) : '',
                        ]);
                    }
                }
            });

            fclose($file);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="transfers_export_' . date('Y-m-d') . '.csv"',
        ]);
    }

    /**
     * Download the CSV import template.
     */
    public function downloadTemplate(): StreamedResponse
    {
        return response()->stream(function () {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($file, ['Transfer Name', 'Destination', 'From Date', 'To Date', 'Price', 'Transfer Details', 'Image Link']);
            fputcsv($file, ['Airport Transfer', 'Delhi', '01-01-2025', '31-12-2025', 1500, 'AC sedan transfer', '']);
            fclose($file);
        }, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="transfer_import_template.csv"',
        ]);
    }

    // ─── Private Helpers ──────────────────────────────────────────────────────────

    /**
     * Format a Transfer model for API response.
     */
    private function formatTransfer(Transfer $transfer): array
    {
        return [
            'id' => $transfer->id,
            'name' => $transfer->name,
            'destination' => $transfer->destination,
            'transfer_details' => $transfer->transfer_details,
            'transfer_photo' => $transfer->transfer_photo ? asset('storage/' . $transfer->transfer_photo) : null,
            'status' => $transfer->status,
            'price_updates_count' => $transfer->price_updates_count,
            'created_by' => $transfer->created_by,
            'created_by_name' => $transfer->creator?->name ?? 'Travbizz Travel IT Solutions',
            'last_update' => $transfer->updated_at?->format('d-m-Y'),
            'updated_at' => $transfer->updated_at,
            'created_at' => $transfer->created_at,
        ];
    }

    /**
     * Process the uploaded import file (CSV or Excel).
     * Returns [$importedCount, $errors[]]
     */
    private function processImportFile($file): array
    {
        $importedCount = 0;
        $errors = [];
        $ext = strtolower($file->getClientOriginalExtension());

        if ($ext === 'csv') {
            $handle = fopen($file->getPathname(), 'r');
            if (!$handle)
                throw new \Exception('Failed to open CSV file');
            fgetcsv($handle); // skip header
            $row = 1;
            while (($data = fgetcsv($handle)) !== false) {
                $row++;
                [$importedCount, $errors] = $this->importRow($data, $row, $importedCount, $errors);
            }
            fclose($handle);
        } else {
            if (!class_exists(\PhpOffice\PhpSpreadsheet\IOFactory::class)) {
                throw new \Exception('Excel import requires phpoffice/phpspreadsheet. Run: composer require phpoffice/phpspreadsheet');
            }
            $spreadsheet = \PhpOffice\PhpSpreadsheet\IOFactory::load($file->getPathname());
            $rows = $spreadsheet->getActiveSheet()->toArray();
            foreach (array_slice($rows, 1) as $index => $data) {
                $row = $index + 2;
                [$importedCount, $errors] = $this->importRow($data, $row, $importedCount, $errors);
            }
        }

        return [$importedCount, $errors];
    }

    /**
     * Import a single row into the Transfer model.
     */
    private function importRow(array $row, int $rowNumber, int $count, array $errors): array
    {
        try {
            if (empty($row[0])) {
                $errors[] = "Row {$rowNumber}: Transfer name is required";
                return [$count, $errors];
            }

            $transfer = Transfer::create([
                'name' => $row[0],
                'destination' => $row[1] ?? '',
                'transfer_details' => $row[4] ?? '',
                'status' => $row[6] ?? 'active',
                'created_by' => auth()->id(),
            ]);

            if (!empty($row[7]) && is_numeric($row[7])) {
                $transfer->prices()->create([
                    'vehicle_type' => $row[8] ?? 'Standard',
                    'price' => $row[7],
                    'capacity' => $row[9] ?? 4,
                ]);
            }

            $count++;
        } catch (\Exception $e) {
            $errors[] = "Row {$rowNumber}: " . $e->getMessage();
        }

        return [$count, $errors];
    }
}
