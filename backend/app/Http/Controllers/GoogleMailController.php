<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\GmailService;
use Laravel\Socialite\Facades\Socialite;
use App\Models\User;
use App\Models\CrmEmail;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Carbon\Carbon;

class GoogleMailController extends Controller
{
    protected $gmailService;

    public function __construct(GmailService $gmailService)
    {
        $this->gmailService = $gmailService;
    }

    /**
     * Return the Google OAuth URL with signed state (user_id).
     * Requires auth so we know which CRM user is connecting. Frontend should call this then redirect to the URL.
     */
    public function getConnectUrl(): JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'You must be logged in to connect Gmail.'], 401);
        }

        $this->applyCompanyGoogleConfig();

        if (!config('services.google.client_id')) {
            return response()->json([
                'error' => 'Google Client ID not set. Add GOOGLE_CLIENT_ID in .env or configure in Settings → Email Integration.',
            ], 400);
        }

        $state = Crypt::encryptString(json_encode(['user_id' => $user->id, 'ts' => time()]));

        $redirectResponse = Socialite::driver('google')
            ->scopes([
                'https://www.googleapis.com/auth/gmail.send',
                'https://www.googleapis.com/auth/gmail.readonly',
                'https://www.googleapis.com/auth/gmail.modify',
            ])
            ->with(['access_type' => 'offline', 'prompt' => 'consent', 'state' => $state])
            ->stateless()
            ->redirect();

        return response()->json(['url' => $redirectResponse->getTargetUrl()]);
    }

    /**
     * Legacy: direct redirect to Google (no auth on this request, so callback may get "User not found").
     * Prefer using getConnectUrl() from frontend with auth, then redirect to returned URL.
     */
    public function redirect()
    {
        $this->applyCompanyGoogleConfig();

        if (!config('services.google.client_id')) {
            $frontendUrl = config('app.frontend_url', '/');
            return redirect(rtrim($frontendUrl, '/') . '/settings?google_connected=false&error=' . urlencode('Google Client ID not set. Add GOOGLE_CLIENT_ID in .env or configure in Settings → Email Integration.'));
        }

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
        $frontendUrl = rtrim(config('app.frontend_url', '/'), '/');
        $settingsPath = $frontendUrl . '/settings/mail';

        // Google can redirect with ?error=... (e.g. access_denied) instead of code
        if (request()->has('error')) {
            $err = request('error');
            $msg = $err === 'access_denied' ? 'You cancelled or Google denied access.' : ('Google error: ' . $err);
            return redirect($settingsPath . '?google_connected=false&error=' . urlencode($msg));
        }
        if (!request()->has('code')) {
            return redirect($settingsPath . '?google_connected=false&error=' . urlencode('No authorization code from Google. Try Connect Gmail again.'));
        }

        try {
            $this->applyCompanyGoogleConfig();

            $googleUser = Socialite::driver('google')->stateless()->user();

            $user = null;
            $state = request()->input('state');
            if ($state) {
                try {
                    $decoded = json_decode(Crypt::decryptString($state), true);
                    if (!empty($decoded['user_id'])) {
                        $user = User::find($decoded['user_id']);
                    }
                } catch (\Exception $e) {
                    // Invalid or expired state; fall back to email match
                }
            }
            if (!$user) {
                $user = Auth::user() ?: User::where('email', $googleUser->getEmail())->first();
            }

            if (!$user) {
                return redirect($settingsPath . '?google_connected=false&error=' . urlencode('User not found. Please start "Connect Gmail" again while logged in to the CRM.'));
            }

            $user->update([
                'google_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
                'google_token_expires_at' => Carbon::now()->addSeconds($googleUser->expiresIn ?? 3600),
                'gmail_email' => $googleUser->getEmail(),
            ]);

            return redirect($settingsPath . '?google_connected=true');
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::warning('Google callback error: ' . $e->getMessage());
            return redirect($settingsPath . '?google_connected=false&error=' . urlencode($e->getMessage()));
        }
    }

    public function sendGmail(Request $request)
    {
        $this->applyCompanyGoogleConfig();

        $request->validate([
            'to' => 'required_without:to_email|email',
            'to_email' => 'required_without:to|email',
            'subject' => 'required|string',
            'body' => 'required|string',
            'lead_id' => 'nullable|exists:leads,id',
            'thread_id' => 'nullable|string',
        ]);

        $to = $request->to ?? $request->to_email;

        $result = $this->gmailService->sendMail(
            Auth::user(),
            $to,
            $request->subject,
            $request->body,
            $request->lead_id,
            $request->thread_id
        );

        if ($result['status'] === 'success') {
            return response()->json(['success' => true, 'message' => 'Email sent successfully', 'data' => $result]);
        }

        return response()->json(['success' => false, 'error' => $result['error']], 400);
    }

    public function syncInbox()
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['error' => 'You must be logged in to sync inbox.'], 401);
        }

        if (!$user->google_refresh_token && empty($user->google_token)) {
            return response()->json([
                'error' => 'Gmail not connected. Connect Gmail in Settings → Email Integration first.',
            ], 400);
        }

        try {
            $this->applyCompanyGoogleConfig();
            $success = $this->gmailService->syncInbox($user);

            if ($success) {
                return response()->json(['message' => 'Inbox synced successfully']);
            }

            return response()->json([
                'error' => 'Failed to sync inbox. Token may have expired. Try disconnecting and reconnecting Gmail in Settings.',
            ], 400);
        } catch (\InvalidArgumentException $e) {
            \Illuminate\Support\Facades\Log::warning('Gmail sync invalid token: ' . $e->getMessage());
            return response()->json([
                'error' => 'Invalid Gmail token. Please disconnect and reconnect Gmail in Settings → Email Integration.',
            ], 400);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Gmail sync error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to sync inbox: ' . $e->getMessage(),
            ], 400);
        }
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

    /**
     * Get recent emails across all leads (for Mail inbox page).
     * Includes emails linked to company leads, and synced emails to/from company users' Gmail (even without lead).
     */
    public function getInbox(): JsonResponse
    {
        $user = Auth::user();
        $companyId = $user?->company_id;
        if (function_exists('tenant') && $tenant = tenant()) {
            $companyId = $companyId ?? (isset($tenant->id) ? (int) $tenant->id : null);
        }
        $leadIds = Lead::withoutGlobalScopes()
            ->when($companyId, fn ($q) => $q->where('company_id', $companyId))
            ->pluck('id')
            ->all();

        $companyGmailEmails = collect();
        if ($companyId) {
            $companyGmailEmails = User::where('company_id', $companyId)
                ->whereNotNull('gmail_email')
                ->where('gmail_email', '!=', '')
                ->pluck('gmail_email');
        }
        if ($user?->gmail_email) {
            $companyGmailEmails = $companyGmailEmails->push($user->gmail_email)->unique()->values();
        }

        $emails = CrmEmail::query()
            ->with('lead:id,client_name,email')
            ->where(function ($q) use ($leadIds, $companyGmailEmails) {
                $q->whereIn('lead_id', $leadIds);
                if ($companyGmailEmails->isNotEmpty()) {
                    $q->orWhere(function ($q2) use ($companyGmailEmails) {
                        $q2->whereNull('lead_id')
                            ->where(function ($q3) use ($companyGmailEmails) {
                                $q3->whereIn('to_email', $companyGmailEmails)
                                    ->orWhereIn('from_email', $companyGmailEmails);
                            });
                    });
                }
            })
            ->orderBy('created_at', 'desc')
            ->limit(100)
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
