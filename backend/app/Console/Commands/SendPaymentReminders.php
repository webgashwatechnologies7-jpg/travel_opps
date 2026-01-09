<?php

namespace App\Console\Commands;

use App\Modules\Payments\Domain\Entities\Payment;
use App\Modules\Payments\Domain\Entities\PaymentReminderLog;
use Illuminate\Console\Command;

class SendPaymentReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:send-reminders';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send payment reminders for payments due today';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting payment reminder process...');

        $today = now()->toDateString();

        // Fetch payments where due_date = today AND status != 'paid'
        $payments = Payment::with(['lead'])
            ->where('due_date', $today)
            ->where('status', '!=', 'paid')
            ->get();

        if ($payments->isEmpty()) {
            $this->info('No payments due today that require reminders.');
            return Command::SUCCESS;
        }

        $this->info("Found {$payments->count()} payment(s) due today.");

        $sentCount = 0;
        $failedCount = 0;

        foreach ($payments as $payment) {
            try {
                // Get recipient phone number from lead
                $sentTo = $payment->lead->phone ?? $payment->lead->email ?? null;

                if (!$sentTo) {
                    $this->warn("Payment ID {$payment->id}: No phone or email found for lead ID {$payment->lead_id}");
                    $failedCount++;
                    continue;
                }

                // Send WhatsApp reminder (placeholder function)
                $this->sendWhatsappReminder($payment, $sentTo);

                // Log reminder in payment_reminder_logs
                PaymentReminderLog::create([
                    'payment_id' => $payment->id,
                    'sent_to' => $sentTo,
                    'sent_at' => now(),
                ]);

                $this->info("Reminder sent for Payment ID {$payment->id} to {$sentTo}");
                $sentCount++;

            } catch (\Exception $e) {
                $this->error("Failed to send reminder for Payment ID {$payment->id}: " . $e->getMessage());
                $failedCount++;
            }
        }

        $this->info("Payment reminder process completed.");
        $this->info("Successfully sent: {$sentCount}");
        $this->info("Failed: {$failedCount}");

        return Command::SUCCESS;
    }

    /**
     * Send WhatsApp reminder (placeholder function).
     *
     * @param Payment $payment
     * @param string $sentTo
     * @return void
     */
    protected function sendWhatsappReminder(Payment $payment, string $sentTo): void
    {
        // TODO: Implement actual WhatsApp API integration
        // This is a placeholder function
        
        $message = $this->buildReminderMessage($payment);
        
        // Placeholder: Log the message that would be sent
        \Log::info("WhatsApp Reminder", [
            'payment_id' => $payment->id,
            'sent_to' => $sentTo,
            'message' => $message,
        ]);

        // Example: You would integrate with WhatsApp API here
        // $whatsappService->sendMessage($sentTo, $message);
    }

    /**
     * Build reminder message.
     *
     * @param Payment $payment
     * @return string
     */
    protected function buildReminderMessage(Payment $payment): string
    {
        $lead = $payment->lead;
        $remainingAmount = $payment->amount - $payment->paid_amount;

        return sprintf(
            "Hello %s,\n\n" .
            "This is a reminder that you have a payment due today.\n\n" .
            "Payment Details:\n" .
            "Amount: %s\n" .
            "Paid: %s\n" .
            "Remaining: %s\n" .
            "Due Date: %s\n\n" .
            "Please make the payment at your earliest convenience.\n\n" .
            "Thank you!",
            $lead->client_name ?? 'Valued Customer',
            number_format($payment->amount, 2),
            number_format($payment->paid_amount, 2),
            number_format($remainingAmount, 2),
            $payment->due_date ? $payment->due_date->format('Y-m-d') : 'N/A'
        );
    }
}
