<?php

namespace App\Http\Controllers\WhatsAppWeb;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;
use App\Models\User;

class WhatsAppSessionController extends Controller
{
    protected $nodeServerUrl;
    protected $apiKey;

    public function __construct()
    {
        $this->nodeServerUrl = env('WHATSAPP_NODE_SERVER_URL', 'http://localhost:3001');
        $this->apiKey = env('WHATSAPP_INTERNAL_API_KEY', 'travelops_secret_key_2024');
    }

    public function getQrCode(Request $request)
    {
        $user = auth()->user();
        $companyId = $user->company_id;
        $userId = $user->id;
        $force = $request->query('force', false);

        try {
            // If force refresh, we could tell Node to logout first, but init usually handles it
            $response = Http::withHeaders(['x-api-key' => $this->apiKey])
                ->post("{$this->nodeServerUrl}/api/session/init", [
                'userId' => $userId,
                'companyId' => $companyId,
                'force' => $force
            ]);

            if ($response->successful()) {
                // Poll DB for QR code
                $session = DB::table('whatsapp_sessions')
                    ->where('user_id', $userId)
                    ->where('company_id', $companyId)
                    ->first();

                // If session exists but no QR yet, it might be generating
                return response()->json([
                    'success' => true,
                    'qr_code' => $session->qr_code ?? null,
                    'status' => $session->status ?? 'Disconnected',
                    'message' => 'Initializing session...'
                ]);
            }

            return response()->json(['success' => false, 'message' => 'Node server unreachable. Please check if WhatsApp backend is running.'], 500);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Connection Error: ' . $e->getMessage()], 500);
        }
    }

    public function getStatus()
    {
        $user = auth()->user();
        $companyId = $user->company_id;
        $userId = $user->id;

        // PRIORITIZE: Any session for this company that is Scanning or Connected
        // This solves the issue if User A started it but User B (or Admin) is looking at it
        $session = DB::table('whatsapp_sessions')
            ->where('company_id', $companyId)
            ->whereIn('status', ['Scanning', 'Connected'])
            ->orderBy('updated_at', 'desc')
            ->first();

        // FALLBACK: If no active session, look for specifically this user's last session
        if (!$session) {
            $session = DB::table('whatsapp_sessions')
                ->where('user_id', $userId)
                ->where('company_id', $companyId)
                ->first();
        }

        // LAST RESORT: Just get anything for this company
        if (!$session && $companyId) {
            $session = DB::table('whatsapp_sessions')
                ->where('company_id', $companyId)
                ->orderBy('id', 'desc')
                ->first();
        }

        return response()->json([
            'success' => true,
            'status' => $session->status ?? 'Disconnected',
            'phone_number' => $session->phone_number ?? null,
            'qr_code' => $session->qr_code ?? null,
            'debug' => [
                'current_user_id' => $userId,
                'current_company_id' => $companyId,
                'found_session_for_user' => (bool)$session,
                'db_total_sessions' => DB::table('whatsapp_sessions')->count()
            ]
        ]);
    }

    public function logout()
    {
        $user = auth()->user();
        try {
            $response = Http::withHeaders(['x-api-key' => $this->apiKey])
                ->post("{$this->nodeServerUrl}/api/session/logout", [
                'userId' => $user->id,
                'companyId' => $user->company_id
            ]);

            if ($response->successful()) {
                return response()->json(['success' => true, 'message' => 'Logged out successfully']);
            }
            return response()->json(['success' => false, 'message' => 'Logout failed'], 500);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
