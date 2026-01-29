<?php

namespace App\Modules\Automation\Infrastructure\ExternalServices;

use App\Modules\Automation\Domain\Entities\WhatsappLog;
use Illuminate\Support\Facades\Log;

class WhatsappService
{
    /**
     * Send a WhatsApp message.
     *
     * @param string $phone Phone number (with country code, e.g., +1234567890)
     * @param string $message Message content
     * @param int|null $leadId Optional lead ID for logging
     * @param int|null $userId Optional user (employee) who sent the message
     * @return bool
     */
    public function sendMessage(string $phone, string $message, ?int $leadId = null, ?int $userId = null): bool
    {
        try {
            // TODO: Implement actual WhatsApp API integration (use $userId to send from that user's number when multi-number is supported)
            Log::info("WhatsApp Message Sent (Placeholder)", [
                'phone' => $phone,
                'message' => $message,
                'lead_id' => $leadId,
                'user_id' => $userId,
            ]);

            // Log in database (user_id = employee who sent, so admin can see per-user chats)
            WhatsappLog::create([
                'lead_id' => $leadId,
                'user_id' => $userId,
                'sent_to' => $phone,
                'message' => $message,
                'sent_at' => now(),
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error("WhatsApp Message Send Failed", [
                'phone' => $phone,
                'message' => $message,
                'lead_id' => $leadId,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Send a WhatsApp template message.
     *
     * @param string $phone Phone number (with country code, e.g., +1234567890)
     * @param string $templateName Template name registered with WhatsApp
     * @param array $params Template parameters to replace placeholders
     * @param int|null $leadId Optional lead ID for logging
     * @param int|null $userId Optional user (employee) who sent the message
     * @return bool
     */
    public function sendTemplate(string $phone, string $templateName, array $params = [], ?int $leadId = null, ?int $userId = null): bool
    {
        try {
            $message = $this->buildTemplateMessage($templateName, $params);

            Log::info("WhatsApp Template Sent (Placeholder)", [
                'phone' => $phone,
                'template_name' => $templateName,
                'params' => $params,
                'message' => $message,
                'lead_id' => $leadId,
                'user_id' => $userId,
            ]);

            WhatsappLog::create([
                'lead_id' => $leadId,
                'user_id' => $userId,
                'sent_to' => $phone,
                'message' => $message,
                'sent_at' => now(),
            ]);

            return true;

        } catch (\Exception $e) {
            Log::error("WhatsApp Template Send Failed", [
                'phone' => $phone,
                'template_name' => $templateName,
                'params' => $params,
                'lead_id' => $leadId,
                'user_id' => $userId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Build message from template and parameters (placeholder).
     *
     * @param string $templateName
     * @param array $params
     * @return string
     */
    protected function buildTemplateMessage(string $templateName, array $params): string
    {
        // Placeholder: Simple template replacement
        // In real implementation, this would fetch template from WhatsApp API
        // and replace placeholders with provided parameters

        $message = "Template: {$templateName}";

        if (!empty($params)) {
            $message .= "\n\nParameters:";
            foreach ($params as $key => $value) {
                $message .= "\n{$key}: {$value}";
            }
        }

        return $message;
    }
}

