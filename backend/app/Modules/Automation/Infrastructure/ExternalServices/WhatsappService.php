<?php

namespace App\Modules\Automation\Infrastructure\ExternalServices;

use App\Modules\Automation\Domain\Entities\WhatsappLog;
use App\Services\WhatsAppService as WhatsAppApiService;
use Illuminate\Support\Facades\Log;

class WhatsappService
{
    /**
     * Send a WhatsApp message. Uses WhatsApp Business API when company has it configured.
     *
     * @param string $phone Phone number (with country code, e.g., 919854465655)
     * @param string $message Message content
     * @param int|null $leadId Optional lead ID for logging
     * @param int|null $userId Optional user (employee) who sent the message
     * @return bool
     */
    public function sendMessage(string $phone, string $message, ?int $leadId = null, ?int $userId = null): bool
    {
        try {
            $company = auth()->user()?->company;
            $apiKey = $company?->whatsapp_api_key ?? config('services.whatsapp.api_key');
            $phoneNumberId = $company?->whatsapp_phone_number_id ?? config('services.whatsapp.phone_number_id');

            if ($apiKey && $phoneNumberId) {
                $api = app(WhatsAppApiService::class)->setCompanyConfig($company);
                $to = preg_replace('/\D/', '', $phone);
                if (strlen($to) < 10) {
                    return false;
                }
                if (strlen($to) === 10 && preg_match('/^[6-9]/', $to)) {
                    $to = '91' . $to;
                }
                $result = $api->sendMessage($to, $message);
                if (!$result['success']) {
                    Log::warning('WhatsApp API send failed', ['error' => $result['error'] ?? 'Unknown']);
                    return false;
                }
            }

            WhatsappLog::create([
                'lead_id' => $leadId,
                'user_id' => $userId,
                'sent_to' => $phone,
                'message' => $message,
                'direction' => 'outbound',
                'sent_at' => now(),
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('WhatsApp Message Send Failed', [
                'phone' => $phone,
                'lead_id' => $leadId,
                'error' => $e->getMessage(),
            ]);
            return false;
        }
    }

    /**
     * Send media (image, document, etc.) via WhatsApp.
     *
     * @param string $phone Phone number with country code
     * @param \Illuminate\Http\UploadedFile $file
     * @param string|null $caption
     * @param int|null $leadId
     * @param int|null $userId
     * @return array{success: bool, error?: string}
     */
    public function sendMedia(string $phone, $file, ?string $caption = null, ?int $leadId = null, ?int $userId = null): array
    {
        try {
            $company = auth()->user()?->company;
            $apiKey = $company?->whatsapp_api_key ?? config('services.whatsapp.api_key');
            $phoneNumberId = $company?->whatsapp_phone_number_id ?? config('services.whatsapp.phone_number_id');

            if (!$apiKey || !$phoneNumberId) {
                return ['success' => false, 'error' => 'WhatsApp not configured. Set up in Settings → WhatsApp.'];
            }

            $api = app(WhatsAppApiService::class)->setCompanyConfig($company);
            $mediaType = $this->getMediaType($file);
            $uploadResult = $api->uploadMedia($file->getPathname(), $mediaType);

            if (!$uploadResult['success']) {
                return ['success' => false, 'error' => $uploadResult['error'] ?? 'Upload failed'];
            }

            $to = preg_replace('/\D/', '', $phone);
            if (strlen($to) < 10) {
                return ['success' => false, 'error' => 'Invalid phone number'];
            }
            if (strlen($to) === 10 && preg_match('/^[6-9]/', $to)) {
                $to = '91' . $to;
            }

            $result = $api->sendMedia($to, $uploadResult['url'], $mediaType, $caption ?? '');

            if ($result['success']) {
                WhatsappLog::create([
                    'lead_id' => $leadId,
                    'user_id' => $userId,
                    'sent_to' => $phone,
                    'message' => $caption,
                    'direction' => 'outbound',
                    'media_url' => $uploadResult['url'] ?? null,
                    'media_type' => $mediaType,
                    'sent_at' => now(),
                ]);
            }

            return $result;
        } catch (\Exception $e) {
            Log::error('WhatsApp media send failed', ['error' => $e->getMessage()]);
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function getMediaType($file): string
    {
        $mime = $file->getMimeType();
        if (str_starts_with($mime ?? '', 'image/')) return 'image';
        if (str_starts_with($mime ?? '', 'video/')) return 'video';
        if (str_starts_with($mime ?? '', 'audio/')) return 'audio';
        return 'document';
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

