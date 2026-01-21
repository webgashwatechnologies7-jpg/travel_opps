<?php

namespace App\Http\Controllers;

use App\Models\PushToken;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use App\Services\CompanyMailSettingsService;

class NotificationController extends Controller
{
    /**
     * Store or update push token for authenticated user.
     */
    public function storeToken(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'platform' => 'nullable|string|max:50',
            'device_name' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated',
            ], 401);
        }

        $tokenValue = $request->input('token');

        $pushToken = PushToken::updateOrCreate(
            ['token' => $tokenValue],
            [
                'user_id' => $user->id,
                'platform' => $request->input('platform', 'web'),
                'device_name' => $request->input('device_name'),
                'last_used_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Push token saved',
            'data' => [
                'push_token' => $pushToken,
            ],
        ], 200);
    }

    /**
     * Delete push token(s) for authenticated user.
     */
    public function deleteToken(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated',
            ], 401);
        }

        $tokenValue = $request->input('token');

        $query = PushToken::where('user_id', $user->id);
        if ($tokenValue) {
            $query->where('token', $tokenValue);
        }

        $deleted = $query->delete();

        return response()->json([
            'success' => true,
            'message' => $deleted ? 'Push token deleted' : 'No matching token found',
            'data' => [
                'deleted' => $deleted,
            ],
        ], 200);
    }

    /**
     * Send push notification via FCM.
     */
    public function sendPush(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:100',
            'body' => 'required|string|max:255',
            'user_ids' => 'nullable|array',
            'user_ids.*' => 'integer|exists:users,id',
            'tokens' => 'nullable|array',
            'tokens.*' => 'string',
            'data' => 'nullable|array',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $serverKey = config('services.fcm.server_key');
        if (!$serverKey) {
            return response()->json([
                'success' => false,
                'message' => 'FCM server key not configured',
            ], 500);
        }

        $tokens = $request->input('tokens', []);
        $userIds = $request->input('user_ids', []);

        if (empty($tokens)) {
            if (empty($userIds) && Auth::check()) {
                $userIds = [Auth::id()];
            }

            if (!empty($userIds)) {
                $tokens = PushToken::whereIn('user_id', $userIds)
                    ->pluck('token')
                    ->unique()
                    ->values()
                    ->all();
            }
        }

        if (empty($tokens)) {
            return response()->json([
                'success' => false,
                'message' => 'No push tokens available',
            ], 404);
        }

        $payload = [
            'notification' => [
                'title' => $request->input('title'),
                'body' => $request->input('body'),
            ],
            'data' => $request->input('data', []),
        ];

        if (count($tokens) === 1) {
            $payload['to'] = $tokens[0];
        } else {
            $payload['registration_ids'] = $tokens;
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'key=' . $serverKey,
                'Content-Type' => 'application/json',
            ])->post('https://fcm.googleapis.com/fcm/send', $payload);

            if (!$response->successful()) {
                Log::error('FCM push send failed', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send push notification',
                    'error' => $response->body(),
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Push notification sent',
                'data' => $response->json(),
            ], 200);
        } catch (\Exception $e) {
            Log::error('FCM push exception', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send push notification',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Send custom email using configured mailer.
     */
    public function sendEmail(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'to' => 'required|email',
            'cc' => 'nullable|email',
            'bcc' => 'nullable|email',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'attachment' => 'nullable|file|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $companyLogo = Setting::getValue('company_logo', '');
        $companyName = Setting::getValue('company_name', config('app.name', 'TravelOps'));
        $companyEmail = Setting::getValue('company_email', config('mail.from.address', ''));
        $companyPhone = Setting::getValue('company_phone', '');
        $companyAddress = Setting::getValue('company_address', '');

        $emailBody = $this->buildBrandedEmailHtml(
            $request->subject,
            $request->body,
            $companyLogo,
            $companyName,
            $companyEmail,
            $companyPhone,
            $companyAddress
        );

        $fromEmail = $companyEmail ?: config('mail.from.address', 'noreply@travelops.com');
        $fromName = $companyName ?: config('mail.from.name', 'TravelOps');

        try {
            CompanyMailSettingsService::applyIfEnabled();
            Mail::send([], [], function ($message) use ($request, $emailBody, $fromEmail, $fromName) {
                $message->from($fromEmail, $fromName)
                    ->to($request->to)
                    ->subject($request->subject)
                    ->html($emailBody);

                if ($request->cc) {
                    $message->cc($request->cc);
                }

                if ($request->bcc) {
                    $message->bcc($request->bcc);
                }

                if ($request->hasFile('attachment')) {
                    $file = $request->file('attachment');
                    $message->attach($file->getRealPath(), [
                        'as' => $file->getClientOriginalName(),
                        'mime' => $file->getMimeType(),
                    ]);
                }
            });

            return response()->json([
                'success' => true,
                'message' => 'Email sent successfully',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Failed to send email', [
                'to' => $request->to,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send email',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    private function buildBrandedEmailHtml(
        string $subject,
        string $body,
        string $companyLogo,
        string $companyName,
        string $companyEmail,
        string $companyPhone,
        string $companyAddress
    ): string {
        return '<!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>' . htmlspecialchars($subject) . '</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
                <tr>
                    <td align="center">
                        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                            <tr>
                                <td style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 30px 40px; text-align: center;">
                                    ' . ($companyLogo ? '<img src="' . $companyLogo . '" alt="' . htmlspecialchars($companyName) . '" style="max-height: 60px; margin-bottom: 10px;">' : '') . '
                                    <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">' . htmlspecialchars($companyName) . '</h1>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 40px;">
                                    <div style="color: #333333; font-size: 15px; line-height: 1.6;">
                                        ' . nl2br(htmlspecialchars($body)) . '
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="color: #6b7280; font-size: 13px;">
                                                <p style="margin: 0 0 10px 0;"><strong>' . htmlspecialchars($companyName) . '</strong></p>
                                                ' . ($companyPhone ? '<p style="margin: 0 0 5px 0;">📞 ' . htmlspecialchars($companyPhone) . '</p>' : '') . '
                                                ' . ($companyEmail ? '<p style="margin: 0 0 5px 0;">✉️ ' . htmlspecialchars($companyEmail) . '</p>' : '') . '
                                                ' . ($companyAddress ? '<p style="margin: 0;">📍 ' . htmlspecialchars($companyAddress) . '</p>' : '') . '
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </body>
        </html>';
    }
}
