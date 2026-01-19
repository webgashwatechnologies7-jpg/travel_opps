<?php

namespace App\Http\Controllers;

use App\Services\WhatsAppService;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class WhatsAppController extends Controller
{
    protected $whatsappService;

    public function __construct(WhatsAppService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Send WhatsApp message
     */
    public function sendMessage(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'to' => 'required|string',
                'message' => 'required_without:template_name|string',
                'template_name' => 'required_without:message|string',
                'template_data' => 'array'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $to = $request->input('to');
            $message = $request->input('message');
            $templateName = $request->input('template_name');
            $templateData = $request->input('template_data', []);

            // Add company context for multi-tenant
            $companyId = auth()->user()->company_id;
            
            // Log message attempt
            Log::info('WhatsApp send attempt', [
                'user_id' => auth()->id(),
                'company_id' => $companyId,
                'to' => $to,
                'is_template' => !empty($templateName)
            ]);

            $result = $this->whatsappService->sendMessage($to, $message, $templateName, $templateData);

            if ($result['success']) {
                // Save message to database
                $this->saveMessage([
                    'company_id' => $companyId,
                    'user_id' => auth()->id(),
                    'lead_id' => $request->input('lead_id'),
                    'to' => $to,
                    'message' => $message,
                    'whatsapp_message_id' => $result['message_id'],
                    'direction' => 'outbound',
                    'status' => 'sent',
                    'is_template' => !empty($templateName)
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Message sent successfully',
                    'data' => [
                        'message_id' => $result['message_id'],
                        'status' => $result['status']
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => $result['error'],
                    'error' => $result['error']
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('WhatsApp send error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'company_id' => auth()->user()?->company_id
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send message',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Send media message
     */
    public function sendMedia(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'to' => 'required|string',
                'media_file' => 'required|file|max:10240', // 10MB max
                'caption' => 'nullable|string|max:1000'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $to = $request->input('to');
            $mediaFile = $request->file('media_file');
            $caption = $request->input('caption', '');

            // Upload media to WhatsApp servers
            $uploadResult = $this->whatsappService->uploadMedia($mediaFile->getPathname(), $this->getMediaType($mediaFile));

            if (!$uploadResult['success']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to upload media',
                    'error' => $uploadResult['error']
                ], 500);
            }

            // Send media message
            $result = $this->whatsappService->sendMedia($to, $uploadResult['url'], $this->getMediaType($mediaFile), $caption);

            if ($result['success']) {
                // Save media message to database
                $this->saveMessage([
                    'company_id' => auth()->user()->company_id,
                    'user_id' => auth()->id(),
                    'lead_id' => $request->input('lead_id'),
                    'to' => $to,
                    'message' => $caption,
                    'media_url' => $uploadResult['url'],
                    'media_type' => $this->getMediaType($mediaFile),
                    'whatsapp_message_id' => $result['message_id'],
                    'direction' => 'outbound',
                    'status' => 'sent'
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Media sent successfully',
                    'data' => [
                        'message_id' => $result['message_id'],
                        'media_url' => $uploadResult['url']
                    ]
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => $result['error'],
                'error' => $result['error']
            ], 500);

        } catch (\Exception $e) {
            Log::error('WhatsApp media send error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send media',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * WhatsApp webhook handler
     */
    public function webhook(Request $request): JsonResponse
    {
        try {
            // Verify webhook signature
            $signature = $request->header('X-Hub-Signature-256');
            $payload = $request->getContent();
            
            if (!$this->whatsappService->verifyWebhook($payload, $signature)) {
                Log::warning('Invalid webhook signature', [
                    'signature' => $signature,
                    'ip' => $request->ip()
                ]);
                return response()->json(['error' => 'Invalid signature'], 403);
            }

            $data = $request->json();

            // Handle different webhook events
            if (isset($data['entry'])) {
                foreach ($data['entry'] as $entry) {
                    if (isset($entry['changes'])) {
                        foreach ($entry['changes'] as $change) {
                            $this->processWebhookChange($change);
                        }
                    }
                }
            }

            return response()->json(['status' => 'received']);

        } catch (\Exception $e) {
            Log::error('WhatsApp webhook error', [
                'error' => $e->getMessage(),
                'payload' => $request->getContent()
            ]);

            return response()->json(['error' => 'Webhook processing failed'], 500);
        }
    }

    /**
     * Get conversation history
     */
    public function getConversation(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'phone' => 'required|string',
                'limit' => 'nullable|integer|min:1|max:100'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $phone = $request->input('phone');
            $limit = $request->input('limit', 50);
            $companyId = auth()->user()->company_id;

            $messages = $this->getMessagesFromDatabase($phone, $companyId, $limit);

            return response()->json([
                'success' => true,
                'message' => 'Conversation retrieved successfully',
                'data' => $messages
            ]);

        } catch (\Exception $e) {
            Log::error('WhatsApp conversation error', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve conversation',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Process webhook change
     */
    private function processWebhookChange($change): void
    {
        if ($change['field'] === 'messages') {
            $messages = $change['value']['messages'] ?? [];
            
            foreach ($messages as $message) {
                if ($message['type'] === 'text' || isset($message['image']) || isset($message['document'])) {
                    $this->processIncomingMessage($message);
                }
            }
        }
    }

    /**
     * Process incoming message
     */
    private function processIncomingMessage($message): void
    {
        $from = $message['from'];
        $messageText = $message['text']['body'] ?? '';
        $messageId = $message['id'];
        $timestamp = $message['timestamp'];

        // Find lead by phone number
        $lead = Lead::where('phone', 'like', '%' . substr($from, -10))->first();

        if ($lead) {
            $this->saveMessage([
                'company_id' => $lead->company_id,
                'lead_id' => $lead->id,
                'from' => $from,
                'message' => $messageText,
                'whatsapp_message_id' => $messageId,
                'direction' => 'inbound',
                'status' => 'received',
                'received_at' => date('Y-m-d H:i:s', $timestamp)
            ]);

            // Trigger real-time event
            if (class_exists(\App\Events\NewWhatsAppMessage::class)) {
                event(new \App\Events\NewWhatsAppMessage($lead, $message));
            }
        }
    }

    /**
     * Save message to database
     */
    private function saveMessage($data): void
    {
        // Create whatsapp_messages table if not exists
        // This would be implemented in a migration
        \DB::table('whatsapp_messages')->insert($data + [
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    /**
     * Get messages from database
     */
    private function getMessagesFromDatabase($phone, $companyId, $limit)
    {
        return \DB::table('whatsapp_messages')
            ->where(function ($query) use ($phone) {
                $query->where('to', $phone)
                      ->orWhere('from', $phone);
            })
            ->where('company_id', $companyId)
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();
    }

    /**
     * Get media type
     */
    private function getMediaType($file): string
    {
        $mimeType = $file->getMimeType();
        
        if (str_starts_with($mimeType, 'image/')) {
            return 'image';
        } elseif (str_starts_with($mimeType, 'video/')) {
            return 'video';
        } elseif (str_starts_with($mimeType, 'audio/')) {
            return 'audio';
        } else {
            return 'document';
        }
    }

    /**
     * Webhook verification
     */
    public function verifyWebhook(Request $request): JsonResponse
    {
        $mode = $request->input('hub.mode');
        $token = $request->input('hub.verify_token');
        $challenge = $request->input('hub.challenge');

        if ($mode === 'subscribe' && $token === config('services.whatsapp.verify_token')) {
            return response($challenge, 200);
        }

        return response()->json(['error' => 'Verification failed'], 403);
    }
}
