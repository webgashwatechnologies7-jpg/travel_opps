<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class StartSoketiLocal extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'soketi:start';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Start Soketi locally using npm';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting Soketi server on port 6001...');

        // Use npx to run soketi
        $process = proc_open('npx @soketi/soketi start --port=6001', [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ], $pipes);

        if (is_resource($process)) {
            while ($line = fgets($pipes[1])) {
                $this->line($line);
            }
            proc_close($process);
        }
    }
}
