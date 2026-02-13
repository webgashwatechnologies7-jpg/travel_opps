<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Services\WhatsAppService;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Automation\Domain\Entities\WhatsappLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
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
            // Enhanced validation
            $validator = Validator::make($request->all(), [
                'to' => 'required|string|regex:/^[+]?[0-9]{10,15}$/',
                'message' => 'required_without:template_name|string|max:1000',
                'template_name' => 'required_without:message|string|max:255',
                'template_data' => 'array',
                'lead_id' => 'nullable|integer|exists:leads,id'
            ]);

            if ($validator->fails()) {
                \Log::warning('WhatsApp message validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'user_id' => auth()->id()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get authenticated user with error handling
            try {
                $user = auth()->user();
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not authenticated'
                    ], 401);
                }
                $companyId = $user->company_id;
            } catch (\Exception $authError) {
                \Log::error('Authentication error in WhatsApp send', [
                    'error' => $authError->getMessage()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication error'
                ], 401);
            }
            
            $to = $request->input('to');
            $message = $request->input('message');
            $templateName = $request->input('template_name');
            $templateData = $request->input('template_data', []);
            $leadId = $request->input('lead_id');

            // Log message attempt
            \Log::info('WhatsApp send attempt', [
                'user_id' => auth()->id(),
                'company_id' => $companyId,
                'to' => $to,
                'is_template' => !empty($templateName),
                'has_lead' => !empty($leadId)
            ]);

            // Send message with timeout handling
            try {
                $result = $this->whatsappService->sendMessage($to, $message, $templateName, $templateData);
            } catch (\Exception $serviceError) {
                \Log::error('WhatsApp service error during send', [
                    'error' => $serviceError->getMessage(),
                    'to' => $to,
                    'user_id' => auth()->id(),
                    'company_id' => $companyId
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'WhatsApp service temporarily unavailable',
                    'error' => config('app.debug') ? $serviceError->getMessage() : 'Service error'
                ], 503);
            }

            if ($result['success']) {
                // Save message to database with error handling
                try {
                    $this->saveMessage([
                        'company_id' => $companyId,
                        'user_id' => auth()->id(),
                        'lead_id' => $leadId,
                        'to' => $to,
                        'message' => $message,
                        'whatsapp_message_id' => $result['message_id'],
                        'direction' => 'outbound',
                        'status' => 'sent',
                        'is_template' => !empty($templateName)
                    ]);
                } catch (\Exception $dbError) {
                    \Log::error('Failed to save WhatsApp message to database', [
                        'error' => $dbError->getMessage(),
                        'message_id' => $result['message_id'] ?? 'unknown',
                        'user_id' => auth()->id()
                    ]);
                    // Continue with success response even if DB save fails
                }

                \Log::info('WhatsApp message sent successfully', [
                    'message_id' => $result['message_id'],
                    'to' => $to,
                    'user_id' => auth()->id()
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
                \Log::warning('WhatsApp message send failed', [
                    'error' => $result['error'] ?? 'Unknown error',
                    'to' => $to,
                    'user_id' => auth()->id()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => $result['error'] ?? 'Failed to send message',
                    'error' => $result['error'] ?? 'Unknown error'
                ], 500);
            }
            
        } catch (\Exception $e) {
            \Log::error('Critical WhatsApp send error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
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
            // Enhanced validation
            $validator = Validator::make($request->all(), [
                'to' => 'required|string|regex:/^[+]?[0-9]{10,15}$/',
                'media_file' => 'required|file|max:10240|mimes:jpg,jpeg,png,gif,mp4,mpeg,mp3,wav,pdf,doc,docx',
                'caption' => 'nullable|string|max:1000',
                'lead_id' => 'nullable|integer|exists:leads,id'
            ]);

            if ($validator->fails()) {
                \Log::warning('WhatsApp media validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'user_id' => auth()->id()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Get authenticated user
            try {
                $user = auth()->user();
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not authenticated'
                    ], 401);
                }
                $companyId = $user->company_id;
            } catch (\Exception $authError) {
                \Log::error('Authentication error in WhatsApp media send', [
                    'error' => $authError->getMessage()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Authentication error'
                ], 401);
            }

            $to = $request->input('to');
            $mediaFile = $request->file('media_file');
            $caption = $request->input('caption', '');
            $leadId = $request->input('lead_id');

            // Validate file integrity
            if (!$mediaFile->isValid()) {
                \Log::error('Invalid media file uploaded', [
                    'error' => $mediaFile->getErrorMessage(),
                    'original_name' => $mediaFile->getClientOriginalName(),
                    'size' => $mediaFile->getSize(),
                    'user_id' => auth()->id()
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid media file',
                    'error' => $mediaFile->getErrorMessage()
                ], 422);
            }

            try {
                // Upload media to WhatsApp servers
                $uploadResult = $this->whatsappService->uploadMedia($mediaFile->getPathname(), $this->getMediaType($mediaFile));

                if (!$uploadResult['success']) {
                    \Log::error('WhatsApp media upload failed', [
                        'error' => $uploadResult['error'] ?? 'Unknown upload error',
                        'file_name' => $mediaFile->getClientOriginalName(),
                        'file_size' => $mediaFile->getSize(),
                        'user_id' => auth()->id()
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'message' => 'Failed to upload media',
                        'error' => $uploadResult['error'] ?? 'Upload failed'
                    ], 500);
                }

                // Send media message
                $result = $this->whatsappService->sendMedia($to, $uploadResult['url'], $this->getMediaType($mediaFile), $caption);

                if ($result['success']) {
                    // Save media message to database
                    try {
                        $this->saveMessage([
                            'company_id' => $companyId,
                            'user_id' => auth()->id(),
                            'lead_id' => $leadId,
                            'to' => $to,
                            'message' => $caption,
                            'media_url' => $uploadResult['url'],
                            'media_type' => $this->getMediaType($mediaFile),
                            'whatsapp_message_id' => $result['message_id'],
                            'direction' => 'outbound',
                            'status' => 'sent'
                        ]);
                    } catch (\Exception $dbError) {
                        \Log::error('Failed to save WhatsApp media message', [
                            'error' => $dbError->getMessage(),
                            'message_id' => $result['message_id'] ?? 'unknown',
                            'user_id' => auth()->id()
                        ]);
                        // Continue with success response
                    }

                    \Log::info('WhatsApp media sent successfully', [
                        'message_id' => $result['message_id'],
                        'to' => $to,
                        'media_url' => $uploadResult['url'],
                        'user_id' => auth()->id()
                    ]);

                    return response()->json([
                        'success' => true,
                        'message' => 'Media sent successfully',
                        'data' => [
                            'message_id' => $result['message_id'],
                            'media_url' => $uploadResult['url']
                        ]
                    ]);
                } else {
                    \Log::error('WhatsApp media send failed', [
                        'error' => $result['error'] ?? 'Unknown error',
                        'to' => $to,
                        'media_url' => $uploadResult['url'] ?? 'unknown',
                        'user_id' => auth()->id()
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'message' => $result['error'] ?? 'Failed to send media',
                        'error' => $result['error'] ?? 'Unknown error'
                    ], 500);
                }
                
            } catch (\Exception $serviceError) {
                \Log::error('WhatsApp service error during media send', [
                    'error' => $serviceError->getMessage(),
                    'to' => $to,
                    'file_name' => $mediaFile->getClientOriginalName(),
                    'user_id' => auth()->id(),
                    'company_id' => $companyId
                ]);
                
                return response()->json([
                    'success' => false,
                    'message' => 'WhatsApp service temporarily unavailable',
                    'error' => config('app.debug') ? $serviceError->getMessage() : 'Service error'
                ], 503);
            }

        } catch (\Exception $e) {
            \Log::error('Critical WhatsApp media send error', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
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
     * Unified webhook for /api/whatsapp/webhook - handles GET (Meta verification) and POST (incoming messages)
     */
    public function webhookUnified(Request $request)
    {
        if ($request->isMethod('get')) {
            return $this->verifyWebhook($request);
        }

        // POST: find company from payload and process
        try {
            $data = $request->json();
            $phoneNumberId = null;
            if (isset($data['entry'][0]['changes'][0]['value']['metadata']['phone_number_id'])) {
                $phoneNumberId = $data['entry'][0]['changes'][0]['value']['metadata']['phone_number_id'];
            }
            $company = null;
            if ($phoneNumberId) {
                $company = Company::where('whatsapp_phone_number_id', $phoneNumberId)->first();
            }
            if (!$company) {
                $company = Company::where('whatsapp_enabled', true)->first();
            }
            if (!$company) {
                Log::warning('WhatsApp webhook: no company found for phone_number_id', ['phone_number_id' => $phoneNumberId]);
                return response()->json(['status' => 'ignored'], 200);
            }

            $tenantId = $company->id;
            app()->instance('tenant.id', $tenantId);

            return $this->webhook($request, $company->id);
        } catch (\Exception $e) {
            Log::error('WhatsApp webhookUnified error', ['error' => $e->getMessage()]);
            return response()->json(['error' => 'Webhook failed'], 500);
        }
    }

    /**
     * WhatsApp webhook handler
     */
    public function webhook(Request $request, int $company_id): JsonResponse
    {
        try {
            if ((int) $company_id !== (int) tenant('id')) {
                Log::warning('WhatsApp webhook tenant mismatch', [
                    'route_company_id' => $company_id,
                    'tenant_id' => tenant('id'),
                ]);
                return response()->json(['status' => 'ignored'], 200);
            }

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

        $companyId = tenant('id');
        if (!$companyId) {
            Log::warning('WhatsApp webhook missing tenant context', [
                'from' => $from,
                'message_id' => $messageId,
            ]);
            return;
        }

        $normalized = normalize_phone_number($from);
        if (!$normalized) {
            return;
        }

        // Find lead by phone number in tenant scope
        $lead = Lead::where('company_id', $companyId)
            ->where('phone', 'like', '%' . $normalized)
            ->first();

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

            // Also save to whatsapp_logs so LeadDetails WhatsApp tab shows it
            if (Schema::hasColumn('whatsapp_logs', 'direction')) {
                WhatsappLog::create([
                    'lead_id' => $lead->id,
                    'user_id' => null,
                    'sent_to' => null,
                    'from_phone' => $from,
                    'message' => $messageText,
                    'direction' => 'inbound',
                    'sent_at' => date('Y-m-d H:i:s', $timestamp),
                ]);
            }

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
     * Webhook verification (GET from Meta)
     */
    public function verifyWebhook(Request $request)
    {
        $mode = $request->input('hub.mode');
        $token = $request->input('hub.verify_token');
        $challenge = $request->input('hub.challenge');

        if ($mode !== 'subscribe' || !$challenge) {
            return response()->json(['error' => 'Verification failed'], 403);
        }

        $configToken = config('services.whatsapp.verify_token');
        if ($token && ($token === $configToken)) {
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        $companyToken = Company::where('whatsapp_enabled', true)
            ->whereNotNull('whatsapp_verify_token')
            ->where('whatsapp_verify_token', $token)
            ->exists();
        if ($companyToken) {
            return response($challenge, 200)->header('Content-Type', 'text/plain');
        }

        return response()->json(['error' => 'Verification failed'], 403);
    }
}
