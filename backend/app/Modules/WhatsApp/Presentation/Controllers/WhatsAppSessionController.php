<?php

namespace App\Modules\WhatsApp\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\WhatsApp\Domain\Entities\WhatsAppSession;
use App\Traits\StandardApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WhatsAppSessionController extends Controller
{
    use StandardApiResponse;

    private $nodeUrl;

    public function __construct()
    {
        $this->nodeUrl = config('services.whatsapp_server.url', 'http://localhost:3001');
    }

    public function status(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $session = WhatsAppSession::where('user_id', $user->id)
                ->where('company_id', $user->company_id)
                ->first();

            if (!$session) {
                // Return default state if no session exists
                return $this->successResponse([
                    'status' => 'Disconnected',
                    'session_name' => 'user_' . $user->id,
                ]);
            }

            return $this->successResponse(['session' => $session]);
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to fetch session status', $e);
        }
    }

    public function connect(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $sessionName = 'user_' . $user->id;

            // Call Node.js server to initialize session
            $response = Http::post($this->nodeUrl . '/sessions/add', [
                'session_name' => $sessionName,
                'company_id' => $user->company_id,
                'user_id' => $user->id,
            ]);

            if ($response->successful()) {
                $data = $response->json();

                // Update local session data
                WhatsAppSession::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'company_id' => $user->company_id,
                    ],
                    [
                        'session_name' => $sessionName,
                        'status' => 'Scanning',
                        'qr_code' => $data['qr_code'] ?? null,
                    ]
                );

                return $this->successResponse($data, 'Connection initiated. Scan QR code.');
            }

            Log::error('WhatsApp Server connection failed', ['response' => $response->body()]);
            return $this->errorResponse('Failed to connect to WhatsApp Server', 500);
        } catch (\Throwable $e) {
            Log::error('WhatsApp Connect Exception', ['error' => $e->getMessage()]);
            return $this->serverErrorResponse('Failed to initiate connection', $e);
        }
    }

    public function logout(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $sessionName = 'user_' . $user->id;

            // Call Node.js server to logout
            $response = Http::post($this->nodeUrl . '/sessions/delete', [
                'session_name' => $sessionName,
            ]);

            WhatsAppSession::where('user_id', $user->id)
                ->where('company_id', $user->company_id)
                ->delete();

            return $this->successResponse(null, 'Logged out successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to log out', $e);
        }
    }
}
