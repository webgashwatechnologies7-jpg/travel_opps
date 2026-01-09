<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;

class GoogleController extends Controller
{
public function connect()
{
    $query = http_build_query([
        'client_id'     => config('services.google.client_id'),
        'redirect_uri'  => config('services.google.redirect'),
        'response_type' => 'code',
        'scope'         => 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send',
        'access_type'   => 'offline',
        'prompt'        => 'consent',
    ]);

    return redirect('https://accounts.google.com/o/oauth2/v2/auth?' . $query);
}


    public function callback(Request $request)
    {
        if (!$request->code) {
            return redirect()->to(env('FRONTEND_URL') . '/leads?gmail=failed');
        }

        $response = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id'     => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri'  => config('services.google.redirect'),
            'grant_type'    => 'authorization_code',
            'code'          => $request->code,
        ]);

        $data = $response->json();

        if (!isset($data['access_token'])) {
            return redirect()->to(env('FRONTEND_URL') . '/leads?gmail=failed');
        }

        $user = Auth::user();

        // 🔥 Fetch Gmail Email
        $profile = Http::withToken($data['access_token'])
            ->get('https://www.googleapis.com/oauth2/v2/userinfo')
            ->json();

        $user->update([
            'google_token' => $data['access_token'],
            'google_refresh_token' => $data['refresh_token'] ?? $user->google_refresh_token,
            'google_token_expires_at' => now()->addSeconds($data['expires_in']),
            'gmail_email' => $profile['email'] ?? null,
        ]);

        return redirect()->to(env('FRONTEND_URL') . '/leads?gmail=connected');
    }
}
