<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class MailHealthController extends Controller
{
    public function check(Request $request): JsonResponse
    {
        $errors = [];
        $warnings = [];
        $checks = [];

        $mailer = config('mail.default');
        $config = $mailer ? config("mail.mailers.{$mailer}") : null;
        $transport = $config['transport'] ?? null;
        $fromAddress = config('mail.from.address');
        $fromName = config('mail.from.name');

        if (!$mailer) {
            $errors[] = 'MAIL_MAILER is not configured.';
        }

        if ($mailer && !$config) {
            $errors[] = "Mailer configuration not found for '{$mailer}'.";
        }

        if (in_array($mailer, ['log', 'array'], true)) {
            $errors[] = "MAIL_MAILER is set to '{$mailer}', so emails are not being sent.";
        }

        if ($transport === 'smtp') {
            $host = $config['host'] ?? null;
            $port = $config['port'] ?? null;
            $encryption = $config['encryption'] ?? null;

            if (!$host) {
                $errors[] = 'SMTP host is not configured.';
            }
            if (!$port) {
                $errors[] = 'SMTP port is not configured.';
            }

            if ($host && $port) {
                $timeout = 5;
                $connection = @fsockopen($host, (int) $port, $errno, $errstr, $timeout);
                if ($connection) {
                    fclose($connection);
                    $checks[] = "SMTP connection OK ({$host}:{$port}).";
                } else {
                    $errors[] = "SMTP connection failed: {$errstr} ({$errno}).";
                }
            }

            if (!empty($encryption)) {
                $checks[] = "SMTP encryption set to '{$encryption}'.";
            }
        } elseif ($transport === 'sendmail') {
            $path = $config['path'] ?? null;
            if (!$path) {
                $errors[] = 'Sendmail path is not configured.';
            } else {
                $checks[] = 'Sendmail path configured.';
            }
        } elseif ($transport) {
            $checks[] = "Mailer transport set to '{$transport}'.";
        }

        if (!$fromAddress) {
            $errors[] = 'MAIL_FROM_ADDRESS is not configured.';
        }

        $shouldSendTest = filter_var($request->query('send', '1'), FILTER_VALIDATE_BOOLEAN);
        $testRecipient = $request->query('to', $fromAddress);

        if ($shouldSendTest && empty($errors)) {
            if (!$testRecipient) {
                $errors[] = 'Test recipient address is missing.';
            } else {
                try {
                    Mail::raw('Mail health check from ' . config('app.name', 'TravelOps'), function ($message) use ($testRecipient, $fromAddress, $fromName) {
                        if ($fromAddress) {
                            $message->from($fromAddress, $fromName ?: null);
                        }
                        $message->to($testRecipient)
                            ->subject('Mail Health Check');
                    });
                    $checks[] = "Test email sent to {$testRecipient}.";
                } catch (\Throwable $e) {
                    $errors[] = 'Failed to send test email: ' . $e->getMessage();
                }
            }
        } elseif (!$shouldSendTest) {
            $warnings[] = 'Test email not sent (send=0).';
        }

        $success = empty($errors);
        $message = $success ? 'Mail is working.' : 'Mail is not working.';
        $statusCode = 200;

        return response()->json([
            'success' => $success,
            'message' => $message,
            'data' => [
                'mailer' => $mailer,
                'transport' => $transport,
                'from' => $fromAddress,
                'to' => $testRecipient,
                'checks' => $checks,
                'warnings' => $warnings,
                'errors' => $errors,
            ],
        ], $statusCode);
    }
}
