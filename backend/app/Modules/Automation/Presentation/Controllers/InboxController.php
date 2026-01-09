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
}

