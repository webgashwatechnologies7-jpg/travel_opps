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
    protected $signature = 'google-sheets:sync-leads {--company= : Sync for a specific company ID}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sync leads from Google Sheets (supports multi-tenancy)';

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
        $companyId = $this->option('company');

        if ($companyId) {
            $this->info("Starting Google Sheets lead sync for company ID: {$companyId}...");
            $connections = GoogleSheetConnection::where('is_active', true)
                ->where('company_id', $companyId)
                ->get();
        } else {
            $this->info('Starting Google Sheets lead sync for ALL active connections...');
            $connections = GoogleSheetConnection::where('is_active', true)->get();
        }

        if ($connections->isEmpty()) {
            $this->info('No active Google Sheet connections found.');
            return Command::SUCCESS;
        }

        foreach ($connections as $connection) {
            $this->syncForConnection($connection);
        }

        return Command::SUCCESS;
    }

    /**
     * @var array
     */
    protected array $headerMap = [];

    /**
     * Sync leads for a specific connection.
     *
     * @param GoogleSheetConnection $connection
     */
    protected function syncForConnection(GoogleSheetConnection $connection)
    {
        $this->info("--------------------------------------------------");
        $this->info("Processing company ID {$connection->company_id}: {$connection->sheet_url}");

        try {
            // Reset header map for each connection
            $this->headerMap = [];
            
            // Fetch rows from Google Sheet
            $rows = $this->fetchGoogleSheetRows($connection->sheet_url);

            if (empty($rows)) {
                $this->info("No rows found for company {$connection->company_id}.");
                $connection->update(['last_synced_at' => now()]);
                return;
            }

            $this->info("Found " . count($rows) . " row(s).");

            $importedCount = 0;
            $skippedCount = 0;

            foreach ($rows as $row) {
                // Map row to data, injecting the correct company_id
                $leadData = $this->mapRowToLeadData($row, $connection->company_id);

                if (!$leadData) {
                    $skippedCount++;
                    continue;
                }

                // Check for duplicates (at least within this company)
                $existingLead = $this->findDuplicateLead($leadData, $connection->company_id);

                if ($existingLead) {
                    $this->line("Skipping duplicate: {$leadData['client_name']} (info already exists)");
                    $skippedCount++;
                    continue;
                }

                // Create lead
                try {
                    $this->leadRepository->create($leadData);
                    $importedCount++;
                    $this->line("Imported: {$leadData['client_name']}");
                } catch (\Exception $e) {
                    $this->error("Failed to import: {$leadData['client_name']} - {$e->getMessage()}");
                    Log::error('Google Sheets sync error', [
                        'error' => $e->getMessage(),
                        'lead_data' => $leadData,
                        'company_id' => $connection->company_id
                    ]);
                    $skippedCount++;
                }
            }

            // Update last_synced_at
            $connection->update(['last_synced_at' => now()]);
            $this->info("Sync done for company {$connection->company_id}. Imported: {$importedCount}, Skipped: {$skippedCount}");

        } catch (\Exception $e) {
            $this->error("Critical error for company {$connection->company_id}: {$e->getMessage()}");
            Log::error('Google Sheets sync connection failure', [
                'error' => $e->getMessage(),
                'connection_id' => $connection->id,
                'company_id' => $connection->company_id
            ]);
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
                $csvUrl = $sheetUrl; // Fallback to original URL
            }

            // Verify with withoutVerifying() to fix "SSL certificate problem: unable to get local issuer certificate"
            $response = Http::timeout(15)->withoutVerifying()->get($csvUrl);

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
     * @param int $companyId
     * @return array|null
     */
    protected function mapRowToLeadData(array $row, int $companyId): ?array
    {
        if (empty($row)) {
            return null;
        }

        // Support for dynamic mapping based on header names
        $clientName = null;
        $phone = null;
        $email = null;
        $destination = null;
        $source = 'google_sheets';
        $city = null;

        if (!empty($this->headerMap)) {
            // Dynamic mapping using found headers
            $clientName = $row[$this->headerMap['full_name'] ?? $this->headerMap['name'] ?? $this->headerMap['client_name'] ?? 0] ?? null;
            $phone = $row[$this->headerMap['phone_number'] ?? $this->headerMap['phone'] ?? 1] ?? null;
            $destination = $row[$this->headerMap['destination'] ?? $this->headerMap['campaign_name'] ?? 2] ?? null;
            $email = $row[$this->headerMap['email'] ?? 3] ?? null;
            $city = $row[$this->headerMap['city'] ?? -1] ?? null;

            // If we found Google Ads specific headers, change source
            if (isset($this->headerMap['campaign_name']) || isset($this->headerMap['ad_id'])) {
                $source = 'google_ads';
            }
        } else {
            // Fallback to position-based mapping (Original behavior)
            $clientName = $row[0] ?? null;
            $phone = $row[1] ?? null;
            $destination = $row[2] ?? null;
            $email = $row[3] ?? null;
        }

        // Clean values
        $phone = !empty($phone) && strtolower(trim($phone)) !== 'n/a' ? trim($phone) : null;
        $email = !empty($email) && strtolower(trim($email)) !== 'n/a' ? trim($email) : null;

        if (!$clientName || (empty($phone) && empty($email))) {
            return null;
        }

        // If city is present, append to destination or keep separate if Lead model supports it
        if ($city && $destination) {
            $destination = $destination . " ({$city})";
        } elseif ($city) {
            $destination = $city;
        }

        return [
            'client_name' => $clientName,
            'email' => $email,
            'phone' => $phone,
            'source' => $source,
            'destination' => $destination,
            'priority' => 'warm',
            'status' => 'new',
            'created_by' => $this->getSystemUserId($companyId),
            'company_id' => $companyId,
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

            // Capture header row and store index mapping
            if ($isFirstRow) {
                $isFirstRow = false;
                $normalizedHeads = array_map(fn($v) => strtolower(trim((string) $v)), $data);
                
                // Map important fields to their indexes
                foreach ($normalizedHeads as $index => $head) {
                    $this->headerMap[$head] = $index;
                }

                // If it looks like a header row, we skip adding it to rows
                if (in_array('client_name', $normalizedHeads, true) || 
                    in_array('name', $normalizedHeads, true) || 
                    in_array('full_name', $normalizedHeads, true) || 
                    in_array('phone', $normalizedHeads, true) || 
                    in_array('phone_number', $normalizedHeads, true)) {
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
    protected function getSystemUserId(int $companyId): int
    {
        $id = User::where('company_id', $companyId)->min('id');
        return $id ?: 1;
    }

    /**
     * Find duplicate lead by email or phone within a company.
     *
     * @param array $leadData
     * @param int $companyId
     * @return \App\Modules\Leads\Domain\Entities\Lead|null
     */
    protected function findDuplicateLead(array $leadData, int $companyId)
    {
        $query = Lead::where('company_id', $companyId);

        if (!empty($leadData['email']) || !empty($leadData['phone'])) {
            $query->where(function($q) use ($leadData) {
                if (!empty($leadData['email'])) {
                    $q->orWhere('email', $leadData['email']);
                }
                if (!empty($leadData['phone'])) {
                    $q->orWhere('phone', $leadData['phone']);
                }
            });
        } else {
            return null;
        }

        return $query->first();
    }
}

