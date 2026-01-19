<?php

namespace App\Console\Commands;

use App\Modules\Automation\Domain\Entities\GoogleSheetConnection;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Leads\Domain\Interfaces\LeadRepositoryInterface;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncGoogleSheetLeads extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'google-sheets:sync-leads';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync leads from Google Sheets';

    /**
     * @var LeadRepositoryInterface
     */
    protected LeadRepositoryInterface $leadRepository;

    /**
     * Create a new command instance.
     *
     * @param LeadRepositoryInterface $leadRepository
     */
    public function __construct(LeadRepositoryInterface $leadRepository)
    {
        parent::__construct();
        $this->leadRepository = $leadRepository;
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Google Sheets lead sync...');

        // Get active Google Sheet connection
        $connection = GoogleSheetConnection::where('is_active', true)->first();

        if (!$connection) {
            $this->info('No active Google Sheet connection found.');
            return Command::SUCCESS;
        }

        $this->info("Processing sheet: {$connection->sheet_url}");

        try {
            // Fetch rows from Google Sheet (public sheet CSV export)
            $rows = $this->fetchGoogleSheetRows($connection->sheet_url);

            if (empty($rows)) {
                $this->info('No rows found in Google Sheet.');
                $connection->update(['last_synced_at' => now()]);
                return Command::SUCCESS;
            }

            $this->info("Found " . count($rows) . " row(s) in Google Sheet.");

            $importedCount = 0;
            $skippedCount = 0;

            foreach ($rows as $row) {
                // Map Google Sheet row to lead data
                // Assuming Google Sheet has columns: client_name, email, phone, source, destination, priority
                $leadData = $this->mapRowToLeadData($row);

                if (!$leadData) {
                    $skippedCount++;
                    continue;
                }

                // Check for duplicates using email or phone
                $existingLead = $this->findDuplicateLead($leadData);

                if ($existingLead) {
                    $this->line("Skipping duplicate lead: {$leadData['client_name']} (email or phone already exists)");
                    $skippedCount++;
                    continue;
                }

                // Create lead
                try {
                    $this->leadRepository->create($leadData);
                    $importedCount++;
                    $this->line("Imported lead: {$leadData['client_name']}");
                } catch (\Exception $e) {
                    $this->error("Failed to import lead: {$leadData['client_name']} - {$e->getMessage()}");
                    Log::error('Google Sheets sync error', [
                        'error' => $e->getMessage(),
                        'lead_data' => $leadData,
                    ]);
                    $skippedCount++;
                }
            }

            // Update last_synced_at
            $connection->update(['last_synced_at' => now()]);

            $this->info("Sync completed. Imported: {$importedCount}, Skipped: {$skippedCount}");

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error("Error syncing Google Sheets: {$e->getMessage()}");
            Log::error('Google Sheets sync error', [
                'error' => $e->getMessage(),
                'connection_id' => $connection->id,
            ]);
            return Command::FAILURE;
        }
    }

    /**
     * Fetch rows from Google Sheet (placeholder for Google Sheets API).
     *
     * @param string $sheetUrl
     * @return array
     */
    protected function fetchGoogleSheetRows(string $sheetUrl): array
    {
        try {
            $csvUrl = $this->buildGoogleSheetCsvUrl($sheetUrl);

            if (!$csvUrl) {
                Log::warning('Google Sheets sync: unable to build CSV url', ['sheet_url' => $sheetUrl]);
                return [];
            }

            $response = Http::timeout(15)->get($csvUrl);

            if (!$response->successful()) {
                Log::warning('Google Sheets sync: CSV fetch failed', [
                    'sheet_url' => $sheetUrl,
                    'csv_url' => $csvUrl,
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
                return [];
            }

            $csv = $response->body();
            return $this->parseCsvRows($csv);
        } catch (\Exception $e) {
            Log::error('Google Sheets sync: exception while fetching rows', [
                'sheet_url' => $sheetUrl,
                'error' => $e->getMessage(),
            ]);
            return [];
        }
    }

    /**
     * Map Google Sheet row to lead data.
     *
     * @param array $row
     * @return array|null
     */
    protected function mapRowToLeadData(array $row): ?array
    {
        // Assuming row structure: [client_name, email, phone, source, destination, priority]
        // Adjust based on actual Google Sheet structure

        if (empty($row) || count($row) < 4) {
            return null;
        }

        return [
            'client_name' => $row[0] ?? null,
            'email' => !empty($row[1]) ? $row[1] : null,
            'phone' => !empty($row[2]) ? $row[2] : null,
            'source' => $row[3] ?? 'google_sheets',
            'destination' => $row[4] ?? null,
            'priority' => $row[5] ?? 'warm',
            'status' => 'new',
            'created_by' => $this->getSystemUserId(),
            'company_id' => $this->getSystemCompanyId(),
        ];
    }

    /**
     * Build a public CSV export URL from a Google Sheets URL.
     */
    protected function buildGoogleSheetCsvUrl(string $sheetUrl): ?string
    {
        // If user already provided an export URL, use it as-is.
        if (str_contains($sheetUrl, 'output=csv') || str_contains($sheetUrl, 'format=csv')) {
            return $sheetUrl;
        }

        // Typical URLs:
        // https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit#gid=0
        // https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit?gid=0#gid=0
        if (!preg_match('#/spreadsheets/d/([a-zA-Z0-9-_]+)#', $sheetUrl, $matches)) {
            return null;
        }

        $spreadsheetId = $matches[1];

        // Try to extract gid (sheet tab)
        $gid = null;
        if (preg_match('/[\?#&]gid=(\d+)/', $sheetUrl, $gidMatches)) {
            $gid = $gidMatches[1];
        }

        // Use gviz export which works well for public sheets
        // If gid is missing, default to 0
        $gid = $gid ?? '0';
        return "https://docs.google.com/spreadsheets/d/{$spreadsheetId}/gviz/tq?tqx=out:csv&gid={$gid}";
    }

    /**
     * Parse CSV text into row arrays.
     */
    protected function parseCsvRows(string $csv): array
    {
        $rows = [];
        $handle = fopen('php://temp', 'r+');
        fwrite($handle, $csv);
        rewind($handle);

        $isFirstRow = true;
        while (($data = fgetcsv($handle)) !== false) {
            // Skip completely empty rows
            if (empty(array_filter($data, fn($v) => $v !== null && trim((string) $v) !== ''))) {
                continue;
            }

            // Skip header row if present
            if ($isFirstRow) {
                $isFirstRow = false;
                $normalized = array_map(fn($v) => strtolower(trim((string) $v)), $data);
                if (in_array('client_name', $normalized, true) || in_array('name', $normalized, true) || in_array('phone', $normalized, true)) {
                    continue;
                }
            }

            $rows[] = $data;
        }

        fclose($handle);
        return $rows;
    }

    /**
     * Choose a safe system user id for created_by.
     */
    protected function getSystemUserId(): int
    {
        $id = User::query()->min('id');
        return $id ?: 1;
    }

    /**
     * Choose a safe default company_id for imported leads.
     * If your system has multiple companies, you should extend GoogleSheetConnection
     * to store company_id and use that instead.
     */
    protected function getSystemCompanyId(): ?int
    {
        $companyId = User::query()->whereNotNull('company_id')->min('company_id');
        return $companyId ?: null;
    }

    /**
     * Find duplicate lead by email or phone.
     *
     * @param array $leadData
     * @return \App\Modules\Leads\Domain\Entities\Lead|null
     */
    protected function findDuplicateLead(array $leadData)
    {
        $query = Lead::query();

        if (!empty($leadData['email'])) {
            $query->where('email', $leadData['email']);
        }

        if (!empty($leadData['phone'])) {
            $query->orWhere('phone', $leadData['phone']);
        }

        return $query->first();
    }
}

