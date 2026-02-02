<?php

namespace App\Modules\Automation\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Automation\Domain\Entities\WhatsappLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InboxController extends Controller
{
    /**
     * Get WhatsApp inbox grouped by lead.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function inbox(Request $request): JsonResponse
    {
        try {
            // Group whatsapp_logs by lead_id and aggregate data
            $inbox = WhatsappLog::select([
                'whatsapp_logs.lead_id',
                'leads.client_name',
                'leads.phone',
                DB::raw('MAX(whatsapp_logs.sent_at) as last_sent_at'),
                DB::raw('COUNT(whatsapp_logs.id) as total_messages'),
            ])
            ->leftJoin('leads', 'whatsapp_logs.lead_id', '=', 'leads.id')
            ->whereNotNull('whatsapp_logs.lead_id')
            ->groupBy('whatsapp_logs.lead_id', 'leads.client_name', 'leads.phone')
            ->orderBy('last_sent_at', 'DESC')
            ->get()
            ->map(function ($item) {
                // Get the actual last message for this lead
                $lastMessage = WhatsappLog::where('lead_id', $item->lead_id)
                    ->orderBy('sent_at', 'DESC')
                    ->first();

                return [
                    'lead_id' => $item->lead_id,
                    'client_name' => $item->client_name,
                    'phone' => $item->phone,
                    'last_message' => $lastMessage ? $lastMessage->message : null,
                    'last_sent_at' => $item->last_sent_at ? $item->last_sent_at->toIso8601String() : null,
                    'total_messages' => (int) $item->total_messages,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp inbox retrieved successfully',
                'data' => [
                    'inbox' => $inbox,
                    'total_conversations' => $inbox->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving WhatsApp inbox',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get WhatsApp messages for a lead (optionally filtered by user_id for admin viewing one employee's chats).
     *
     * @param int $leadId
     * @param Request $request
     * @return JsonResponse
     */
    public function messagesByLead(int $leadId, Request $request): JsonResponse
    {
        try {
            $query = WhatsappLog::where('lead_id', $leadId);
            if ($request->filled('user_id')) {
                $query->where('user_id', (int) $request->user_id);
            }
            $messages = $query->with('user:id,name,phone')
                ->orderBy('sent_at', 'asc')
                ->get()
                ->map(function ($m) {
                    return [
                        'id' => $m->id,
                        'message' => $m->message,
                        'direction' => $m->direction ?? 'outbound',
                        'media_url' => $m->media_url,
                        'media_type' => $m->media_type,
                        'created_at' => $m->sent_at?->toIso8601String() ?? $m->created_at?->toIso8601String(),
                        'sent_at' => $m->sent_at?->toIso8601String(),
                        'user' => $m->user,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp messages retrieved successfully',
                'data' => [
                    'messages' => $messages,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving WhatsApp messages',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get WhatsApp inbox (conversations) for a specific user/employee. Admin uses this to see who this employee chatted with.
     *
     * @param int $userId
     * @return JsonResponse
     */
    public function inboxByUser(int $userId): JsonResponse
    {
        try {
            $inbox = WhatsappLog::select([
                'whatsapp_logs.lead_id',
                'leads.client_name',
                'leads.phone',
                DB::raw('MAX(whatsapp_logs.sent_at) as last_sent_at'),
                DB::raw('COUNT(whatsapp_logs.id) as total_messages'),
            ])
                ->leftJoin('leads', 'whatsapp_logs.lead_id', '=', 'leads.id')
                ->where('whatsapp_logs.user_id', $userId)
                ->whereNotNull('whatsapp_logs.lead_id')
                ->groupBy('whatsapp_logs.lead_id', 'leads.client_name', 'leads.phone')
                ->orderBy('last_sent_at', 'DESC')
                ->get()
                ->map(function ($item) use ($userId) {
                    $lastMessage = WhatsappLog::where('lead_id', $item->lead_id)
                        ->where('user_id', $userId)
                        ->orderBy('sent_at', 'DESC')
                        ->first();

                    return [
                        'lead_id' => $item->lead_id,
                        'client_name' => $item->client_name,
                        'phone' => $item->phone,
                        'last_message' => $lastMessage ? $lastMessage->message : null,
                        'last_sent_at' => $item->last_sent_at ? $item->last_sent_at->toIso8601String() : null,
                        'total_messages' => (int) $item->total_messages,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'WhatsApp inbox for user retrieved successfully',
                'data' => [
                    'inbox' => $inbox,
                    'total_conversations' => $inbox->count(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving WhatsApp inbox for user',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

