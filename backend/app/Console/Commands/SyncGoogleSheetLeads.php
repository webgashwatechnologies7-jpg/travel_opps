<?php

namespace App\Console\Commands;

use App\Modules\Automation\Domain\Entities\GoogleSheetConnection;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Leads\Domain\Interfaces\LeadRepositoryInterface;
use Illuminate\Console\Command;
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
            // Fetch rows from Google Sheet (placeholder for Google Sheets API)
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
        // TODO: Implement actual Google Sheets API integration
        // This is a placeholder that returns empty array
        // Example implementation would use Google Sheets API v4:
        // 1. Extract spreadsheet ID from URL
        // 2. Authenticate with Google API
        // 3. Fetch data using spreadsheets.values.get
        // 4. Parse and return rows

        Log::info("Google Sheets API placeholder called", [
            'sheet_url' => $sheetUrl,
        ]);

        // Placeholder: Return empty array
        // In real implementation, this would fetch actual data from Google Sheets
        return [];
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
            'created_by' => 1, // System user or first admin user
        ];
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

