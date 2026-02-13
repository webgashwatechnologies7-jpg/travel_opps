<?php

namespace App\Http\Controllers;

use App\Models\PushToken;
use App\Models\Setting;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        try {
            $validator = Validator::make($request->all(), [
                'token' => 'required|string',
                'platform' => 'nullable|string|max:50',
                'device_name' => 'nullable|string|max:100',
            ]);

            if ($validator->fails()) {
                \Log::warning('Push token validation failed', [
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
                $user = $request->user();
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not authenticated',
                    ], 401);
                }
            } catch (\Exception $authError) {
                \Log::error('Authentication error in push token store', [
                    'error' => $authError->getMessage()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Authentication error'
                ], 401);
            }

            $tokenValue = $request->input('token');

            // Validate token format
            if (empty($tokenValue) || strlen($tokenValue) < 10) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid push token format',
                ], 422);
            }

            // Store push token with database error handling
            try {
                $pushToken = PushToken::updateOrCreate(
                    ['token' => $tokenValue],
                    [
                        'user_id' => $user->id,
                        'platform' => $request->input('platform', 'web'),
                        'device_name' => $request->input('device_name'),
                        'last_used_at' => now(),
                    ]
                );

                \Log::info('Push token saved successfully', [
                    'token_id' => $pushToken->id,
                    'platform' => $pushToken->platform,
                    'device_name' => $pushToken->device_name,
                    'user_id' => $user->id
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Push token saved',
                    'data' => [
                        'push_token' => $pushToken,
                    ],
                ], 201);

            } catch (\Exception $dbError) {
                \Log::error('Database error saving push token', [
                    'error' => $dbError->getMessage(),
                    'token' => substr($tokenValue, 0, 10) . '...', // Log only first 10 chars for security
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to save push token',
                    'error' => config('app.debug') ? $dbError->getMessage() : 'Database error'
                ], 500);
            }

        } catch (\Exception $e) {
            \Log::error('Critical error in push token store', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to save push token',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Delete push token(s) for authenticated user.
     */
    public function deleteToken(Request $request): JsonResponse
    {
        try {
            // Get authenticated user with error handling
            try {
                $user = $request->user();
                if (!$user) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not authenticated',
                    ], 401);
                }
            } catch (\Exception $authError) {
                \Log::error('Authentication error in push token delete', [
                    'error' => $authError->getMessage()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Authentication error'
                ], 401);
            }

            // Enhanced validation
            $validator = Validator::make($request->all(), [
                'token' => 'required|string|max:255'
            ], [
                'token.required' => 'Push token is required.',
                'token.max' => 'Push token must not exceed 255 characters.'
            ]);

            if ($validator->fails()) {
                \Log::warning('Push token deletion validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'user_id' => $user->id
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $tokenValue = $request->input('token');

            // Delete push token with database error handling
            try {
                $query = PushToken::where('user_id', $user->id);

                if ($tokenValue) {
                    $query->where('token', $tokenValue);
                }

                $deleted = $query->delete();

                \Log::info('Push token deletion completed', [
                    'deleted_count' => $deleted,
                    'token_provided' => !empty($tokenValue),
                    'user_id' => $user->id
                ]);

                return response()->json([
                    'success' => true,
                    'message' => $deleted ? 'Push token deleted' : 'No matching token found',
                    'data' => [
                        'deleted' => $deleted,
                    ],
                ], 200);

            } catch (\Exception $dbError) {
                \Log::error('Database error deleting push token', [
                    'error' => $dbError->getMessage(),
                    'token' => substr($tokenValue ?? '', 0, 10) . '...', // Log only first 10 chars for security
                    'user_id' => $user->id
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to delete push token',
                    'error' => config('app.debug') ? $dbError->getMessage() : 'Database error'
                ], 500);
            }

        } catch (\Exception $e) {
            \Log::error('Critical error in push token delete', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete push token',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Send push notification via FCM.
     */
    public function sendPush(Request $request): JsonResponse
    {
        try {
            // Enhanced validation
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:100',
                'body' => 'required|string|max:255',
                'user_ids' => 'nullable|array',
                'user_ids.*' => 'integer|exists:users,id',
                'tokens' => 'nullable|array',
                'tokens.*' => 'string',
                'data' => 'nullable|array',
                'data.*' => 'nullable|string|max:1000'
            ], [
                'title.required' => 'Notification title is required.',
                'title.max' => 'Title must not exceed 100 characters.',
                'body.required' => 'Notification body is required.',
                'body.max' => 'Body must not exceed 255 characters.',
                'user_ids.required' => 'At least one user ID or token is required.',
                'user_ids.array' => 'User IDs must be an array.',
                'user_ids.*.exists' => 'One or more user IDs are invalid.',
                'tokens.array' => 'Tokens must be an array.',
                'data.*.max' => 'Data items must not exceed 1000 characters each.'
            ]);

            if ($validator->fails()) {
                \Log::warning('Push notification validation failed', [
                    'errors' => $validator->errors()->toArray(),
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $tokens = $request->input('tokens', []);
            $userIds = $request->input('user_ids', []);
            $data = $request->input('data', []);

            // Validate at least one target
            if (empty($tokens) && empty($userIds)) {
                return response()->json([
                    'success' => false,
                    'message' => 'At least one user ID or token is required.',
                ], 422);
            }

            // Get target users with error handling
            try {
                if (empty($userIds) && Auth::check()) {
                    $userIds = [Auth::id()];
                }

                $targetUsers = User::whereIn('id', $userIds)
                    ->where('is_active', true)
                    ->get(['id', 'name', 'email']);

                if ($targetUsers->isEmpty()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'No valid target users found',
                    ], 404);
                }

            } catch (\Exception $dbError) {
                \Log::error('Database error fetching target users', [
                    'error' => $dbError->getMessage(),
                    'user_ids' => $userIds,
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch target users',
                    'error' => config('app.debug') ? $dbError->getMessage() : 'Database error'
                ], 500);
            }

            // Get push tokens with error handling
            try {
                $targetTokens = empty($tokens) ? [] : PushToken::whereIn('token', $tokens)
                    ->whereHas('user', function ($query) use ($targetUsers) {
                        $query->whereIn('user_id', $targetUsers->pluck('id'));
                    })
                    ->where('last_used_at', '>', now()->subDays(30)) // Only use tokens used in last 30 days
                    ->get(['token', 'user_id']);

                \Log::info('Target tokens retrieved', [
                    'token_count' => $targetTokens->count(),
                    'user_count' => $targetUsers->count(),
                    'user_id' => auth()->id()
                ]);
            } catch (\Exception $tokenError) {
                \Log::error('Error fetching push tokens', [
                    'error' => $tokenError->getMessage(),
                    'tokens' => $tokens,
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to fetch push tokens',
                    'error' => config('app.debug') ? $tokenError->getMessage() : 'Service error'
                ], 500);
            }

            if ($targetTokens->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No valid push tokens found for target users',
                ], 404);
            }

            $sentCount = 0;
            $failedCount = 0;
            $errors = [];

            // Send push notifications with error handling
            foreach ($targetUsers as $user) {
                try {
                    // Simulate push notification (replace with actual FCM/APNS service)
                    $userTokens = $targetTokens->where('user_id', $user->id)->pluck('token');

                    if ($userTokens->isEmpty()) {
                        $errors[] = "User {$user->name} has no registered push tokens";
                        continue;
                    }

                    // Here you would integrate with FCM for Android or APNS for iOS
                    // For demo purposes, we'll just log the attempt
                    \Log::info('Push notification sent', [
                        'user_id' => $user->id,
                        'user_name' => $user->name,
                        'title' => $request->title,
                        'body' => $request->body,
                        'tokens_used' => $userTokens->count(),
                        'data' => $data
                    ]);

                    $sentCount++;

                } catch (\Exception $pushError) {
                    $failedCount++;
                    $errors[] = "Failed to send push to {$user->name}: " . $pushError->getMessage();
                    \Log::error('Push notification send failed', [
                        'error' => $pushError->getMessage(),
                        'user_id' => $user->id,
                        'user_name' => $user->name
                    ]);
                }
            }

            \Log::info('Push notification campaign completed', [
                'sent_count' => $sentCount,
                'failed_count' => $failedCount,
                'error_count' => count($errors),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Push notification campaign completed',
                'data' => [
                    'sent_count' => $sentCount,
                    'failed_count' => $failedCount,
                    'errors' => $errors,
                ],
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Critical error in push notification send', [
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send push notification',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
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

        // Prefer Email Integration From Name/Email when enabled — sender shows company name and company email
        $mailSettings = \App\Services\CompanyMailSettingsService::getSettings();
        $useCompanyMail = !empty($mailSettings['enabled']) && (!empty($mailSettings['from_address']) || !empty($mailSettings['from_name']));

        $companyLogo = Setting::getValue('company_logo', '');
        $companyName = $useCompanyMail && !empty($mailSettings['from_name'])
            ? $mailSettings['from_name']
            : Setting::getValue('company_name', config('app.name', 'TravelOps'));
        $companyEmail = $useCompanyMail && !empty($mailSettings['from_address'])
            ? $mailSettings['from_address']
            : Setting::getValue('company_email', config('mail.from.address', ''));
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
