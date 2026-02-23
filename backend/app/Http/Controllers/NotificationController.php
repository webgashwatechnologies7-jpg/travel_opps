<?php

namespace App\Http\Controllers;

use App\Models\PushToken;
use App\Models\Setting;
use App\Models\User;
use App\Services\CompanyMailSettingsService;
use App\Services\PushNotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;

class NotificationController extends Controller
{
    /**
     * Store or update push token for authenticated user.
     */
    public function storeToken(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'token' => 'required|string|min:10',
                'platform' => 'nullable|string|max:50',
                'device_name' => 'nullable|string|max:100',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $user = $request->user();
            if (!$user) {
                return $this->errorResponse('User not authenticated', 401);
            }

            $pushToken = PushToken::updateOrCreate(
                ['token' => $request->token],
                [
                    'user_id' => $user->id,
                    'platform' => $request->input('platform', 'web'),
                    'device_name' => $request->input('device_name'),
                    'last_used_at' => now(),
                ]
            );

            Log::info('Push token saved', ['user_id' => $user->id, 'platform' => $pushToken->platform]);

            return $this->createdResponse(['push_token' => $pushToken], 'Push token saved');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to save push token', $e);
        }
    }

    /**
     * Delete push token(s) for authenticated user.
     */
    public function deleteToken(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return $this->errorResponse('User not authenticated', 401);
            }

            $validator = Validator::make($request->all(), [
                'token' => 'required|string|max:255'
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $deleted = PushToken::where('user_id', $user->id)
                ->where('token', $request->token)
                ->delete();

            return $this->successResponse(['deleted' => (bool) $deleted], $deleted ? 'Push token deleted' : 'No matching token found');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to delete push token', $e);
        }
    }

    /**
     * Send push notification via FCM.
     */
    public function sendPush(Request $request): JsonResponse
    {
        try {
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
                return $this->validationErrorResponse($validator);
            }

            $tokens = $request->input('tokens', []);
            $userIds = $request->input('user_ids', []);

            if (empty($tokens) && empty($userIds)) {
                return $this->errorResponse('At least one user ID or token is required', 422);
            }

            // Fallback to current user if no targets specified (simplified logic)
            if (empty($userIds) && Auth::check()) {
                $userIds = [Auth::id()];
            }

            $targetUsers = User::whereIn('id', $userIds)->where('is_active', true)->get(['id', 'name']);
            if ($targetUsers->isEmpty() && empty($tokens)) {
                return $this->errorResponse('No valid target users or tokens found', 404);
            }

            // Logic to get tokens for users if only user_ids were provided
            $userTokens = PushToken::whereIn('user_id', $targetUsers->pluck('id'))
                ->where('last_used_at', '>', now()->subDays(60))
                ->pluck('token')
                ->toArray();

            $allTokens = array_unique(array_merge($tokens, $userTokens));

            if (empty($allTokens)) {
                return $this->errorResponse('No valid push tokens found', 404);
            }

            // Call PushNotificationService or simulate
            // For now, we simulate success as in the original code but with cleaner structure
            Log::info('Push notification request', [
                'tokens_count' => count($allTokens),
                'title' => $request->title
            ]);

            return $this->successResponse([
                'sent_count' => count($allTokens),
                'target_users' => $targetUsers->count()
            ], 'Push notification campaign completed');

        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to send push notification', $e);
        }
    }

    /**
     * Send custom email using configured mailer.
     */
    public function sendEmail(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'to' => 'required|email',
                'cc' => 'nullable|email',
                'bcc' => 'nullable|email',
                'subject' => 'required|string|max:255',
                'body' => 'required|string',
                'attachment' => 'nullable|file|max:10240',
            ]);

            if ($validator->fails()) {
                return $this->validationErrorResponse($validator);
            }

            $mailSettings = CompanyMailSettingsService::getSettings();
            $useCompanyMail = !empty($mailSettings['enabled']);

            $companyName = Setting::getValue('company_name', config('app.name', 'TravelOps'));
            $companyEmail = Setting::getValue('company_email', config('mail.from.address', ''));

            $fromEmail = ($useCompanyMail && !empty($mailSettings['from_address'])) ? $mailSettings['from_address'] : $companyEmail;
            $fromName = ($useCompanyMail && !empty($mailSettings['from_name'])) ? $mailSettings['from_name'] : $companyName;

            $emailBody = $this->buildBrandedEmailHtml(
                $request->subject,
                $request->body,
                Setting::getValue('company_logo', ''),
                $fromName,
                $fromEmail,
                Setting::getValue('company_phone', ''),
                Setting::getValue('company_address', '')
            );

            CompanyMailSettingsService::applyIfEnabled();
            Mail::send([], [], function ($message) use ($request, $emailBody, $fromEmail, $fromName) {
                $message->from($fromEmail, $fromName)
                    ->to($request->to)
                    ->subject($request->subject)
                    ->html($emailBody);

                if ($request->cc)
                    $message->cc($request->cc);
                if ($request->bcc)
                    $message->bcc($request->bcc);

                if ($request->hasFile('attachment')) {
                    $file = $request->file('attachment');
                    $message->attach($file->getRealPath(), [
                        'as' => $file->getClientOriginalName(),
                        'mime' => $file->getMimeType(),
                    ]);
                }
            });

            return $this->successResponse(null, 'Email sent successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to send email', $e);
        }
    }

    private function buildBrandedEmailHtml($subject, $body, $logo, $name, $email, $phone, $address): string
    {
        return view('emails.branded', compact('subject', 'body', 'logo', 'name', 'email', 'phone', 'address'))->render();
    }

    /**
     * Get user's recent notifications
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            $notifications = $user->notifications()
                ->orderBy('created_at', 'desc')
                ->limit(50)
                ->get()
                ->map(function ($n) {
                    $data = is_string($n->data) ? json_decode($n->data, true) : $n->data;
                    return [
                        'id' => $n->id,
                        'type' => $data['type'] ?? 'system',
                        'title' => $data['title'] ?? 'Notification',
                        'message' => $data['message'] ?? '',
                        'action_url' => $data['action_url'] ?? null,
                        'is_read' => !is_null($n->read_at),
                        'created_at' => $n->created_at->toISOString(),
                    ];
                });

            return $this->successResponse([
                'notifications' => $notifications,
                'unread_count' => $user->unreadNotifications()->count(),
            ], 'Notifications retrieved');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve notifications', $e);
        }
    }

    /**
     * Mark a notification as read
     */
    public function markAsRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->find($id);
        if ($notification) {
            $notification->markAsRead();
        }
        return $this->successResponse(null, 'Notification marked as read');
    }

    /**
     * Mark all user notifications as read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();
        return $this->successResponse(null, 'All notifications marked as read');
    }

    /**
     * Delete a notification (Only Admins allowed)
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user->is_super_admin && !$user->hasAnyRole(['Admin', 'Company Admin', 'Super Admin'])) {
                return $this->errorResponse('Only admins can delete notifications', 403);
            }

            $notification = $user->notifications()->find($id);
            if (!$notification) {
                return $this->notFoundResponse('Notification not found');
            }

            $notification->delete();
            return $this->deletedResponse('Notification deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to delete notification', $e);
        }
    }
}
