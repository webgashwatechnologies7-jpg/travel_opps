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

    public function getQrCode()
    {
        $user = auth()->user();
        $companyId = $user->company_id;
        $userId = $user->id;

        try {
            // Trigger Node.js to initialize session and get QR
            $response = Http::withHeaders(['x-api-key' => $this->apiKey])
                ->post("{$this->nodeServerUrl}/api/session/init", [
                'userId' => $userId,
                'companyId' => $companyId
            ]);

            if ($response->successful()) {
                // Poll DB for QR code (it will be updated by Node server)
                $session = DB::table('whatsapp_sessions')
                    ->where('user_id', $userId)
                    ->where('company_id', $companyId)
                    ->first();

                return response()->json([
                    'success' => true,
                    'qr_code' => $session->qr_code ?? null,
                    'status' => $session->status ?? 'Disconnected'
                ]);
            }

            return response()->json(['success' => false, 'message' => 'Failed to initialize session'], 500);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function getStatus()
    {
        $user = auth()->user();
        $session = DB::table('whatsapp_sessions')
            ->where('user_id', $user->id)
            ->where('company_id', $user->company_id)
            ->first();

        return response()->json([
            'success' => true,
            'status' => $session->status ?? 'Disconnected',
            'phone_number' => $session->phone_number ?? null,
            'qr_code' => $session->qr_code ?? null
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
