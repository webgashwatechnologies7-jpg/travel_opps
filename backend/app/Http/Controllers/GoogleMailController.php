<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GmailService;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use App\Models\CrmEmail;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class GoogleMailController extends Controller
{
    protected $gmailService;

    public function __construct(GmailService $gmailService)
    {
        $this->gmailService = $gmailService;
    }

    public function redirect()
    {
        $this->applyCompanyGoogleConfig();

        if (!config('services.google.client_id')) {
            $frontendUrl = config('app.frontend_url', '/');
            return redirect(rtrim($frontendUrl, '/') . '/settings?google_connected=false&error=' . urlencode('Google Client ID not set. Add GOOGLE_CLIENT_ID in .env or configure in Settings → Email Integration.'));
        }

        // We use Socialite for the initial redirect to handle scopes easily
        return Socialite::driver('google')
            ->scopes([
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.modify',
            ])
            ->with(['access_type' => 'offline', 'prompt' => 'consent'])
            ->stateless()
            ->redirect();
    }

    public function callback()
    {
        try {
            $this->applyCompanyGoogleConfig();

            $googleUser = Socialite::driver('google')->stateless()->user();
            
            $user = Auth::user() ?: User::where('email', $googleUser->getEmail())->first();

            if (!$user) {
                return response()->json(['error' => 'User not found'], 404);
            }

            $user->update([
                'google_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
                'google_token_expires_at' => Carbon::now()->addSeconds($googleUser->expiresIn),
                'gmail_email' => $googleUser->getEmail(),
            ]);

            // Redirect back to frontend
            return redirect(config('app.frontend_url') . '/settings?google_connected=true');
        } catch (\Exception $e) {
            return redirect(config('app.frontend_url') . '/settings?google_connected=false&error=' . urlencode($e->getMessage()));
        }
    }

    public function sendGmail(Request $request)
    {
        $this->applyCompanyGoogleConfig();

        $request->validate([
            'to' => 'required|email',
            'subject' => 'required|string',
            'body' => 'required|string',
            'lead_id' => 'nullable|exists:leads,id',
        ]);

        $result = $this->gmailService->sendMail(
            Auth::user(),
            $request->to,
            $request->subject,
            $request->body,
            $request->lead_id
        );

        if ($result['status'] === 'success') {
            return response()->json(['message' => 'Email sent successfully', 'data' => $result]);
        }

        return response()->json(['error' => $result['error']], 400);
    }

    public function syncInbox()
    {
        $this->applyCompanyGoogleConfig();

        $success = $this->gmailService->syncInbox(Auth::user());

        if ($success) {
            return response()->json(['message' => 'Inbox synced successfully']);
        }

        return response()->json(['error' => 'Failed to sync inbox'], 400);
    }

    public function getEmails($leadId)
    {
        $emails = CrmEmail::where('lead_id', $leadId)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ['emails' => $emails],
        ]);
    }

    private function applyCompanyGoogleConfig(): void
    {
        $company = (app()->bound('tenant') ? app('tenant') : null) ?? (Auth::user() ? Auth::user()->company : null);

        $clientId = $company?->google_client_id ?? config('services.google.client_id');
        $clientSecret = $company?->google_client_secret ?? config('services.google.client_secret');
        $redirectUri = $company?->google_redirect_uri ?? config('services.google.redirect') ?? config('services.google.redirect_uri');

        $this->gmailService->setClientConfig($clientId, $clientSecret, $redirectUri);

        config([
            'services.google.client_id' => $clientId,
            'services.google.client_secret' => $clientSecret,
            'services.google.redirect_uri' => $redirectUri,
            'services.google.redirect' => $redirectUri,
        ]);
    }
}
