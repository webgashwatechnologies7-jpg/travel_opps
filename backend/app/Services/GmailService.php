<?php

namespace App\Services;

use Google\Client;
use Google\Service\Gmail;
use Google\Service\Gmail\Message;
use App\Models\User;
use App\Models\CrmEmail;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class GmailService
{
    protected $client;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        $this->client->setRedirectUri(config('services.google.redirect_uri'));
        $this->client->addScope([
            Gmail::GMAIL_SEND,
            Gmail::GMAIL_READONLY,
            Gmail::GMAIL_MODIFY,
        ]);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('select_account consent');
    }

    public function setClientConfig(?string $clientId, ?string $clientSecret, ?string $redirectUri): void
    {
        if ($clientId) {
            $this->client->setClientId($clientId);
        }
        if ($clientSecret) {
            $this->client->setClientSecret($clientSecret);
        }
        if ($redirectUri) {
            $this->client->setRedirectUri($redirectUri);
        }
    }

    public function getClient()
    {
        return $this->client;
    }

    public function setUser(User $user)
    {
        // Google Client requires access_token to be set - null causes "Invalid token format"
        $accessTokenValue = !empty($user->google_token) ? $user->google_token : null;
        $refreshToken = $user->google_refresh_token;

        if (!$accessTokenValue && !$refreshToken) {
            Log::warning("Gmail setUser: User {$user->id} has no Google tokens. Reconnect Gmail in Settings.");
            return false;
        }

        $expiresAt = $user->google_token_expires_at;
        $expiresIn = $expiresAt
            ? (int) Carbon::now()->diffInSeconds($expiresAt, false)
            : 0;
        $created = $expiresAt
            ? (int) Carbon::parse($expiresAt)->subSeconds(3600)->timestamp
            : 0;

        $accessToken = array_filter([
            'access_token' => $accessTokenValue ?? 'pending-refresh',
            'refresh_token' => $refreshToken,
            'expires_in' => $expiresIn,
            'created' => $created,
        ], fn ($v) => $v !== null && $v !== '');

        // Ensure access_token key exists (required by Google Client)
        if (empty($accessToken['access_token'])) {
            $accessToken['access_token'] = 'pending-refresh';
        }

        $this->client->setAccessToken($accessToken);

        if ($this->client->isAccessTokenExpired()) {
            if ($user->google_refresh_token) {
                $newToken = $this->client->fetchAccessTokenWithRefreshToken($user->google_refresh_token);
                if (isset($newToken['error'])) {
                    Log::error("Gmail token refresh failed for user {$user->id}: " . json_encode($newToken));
                    return false;
                }
                $user->update([
                    'google_token' => $newToken['access_token'],
                    'google_token_expires_at' => Carbon::now()->addSeconds($newToken['expires_in']),
                ]);
                $this->client->setAccessToken($newToken);
            } else {
                return false;
            }
        }

        return true;
    }

    public function sendMail(User $user, $to, $subject, $body, $leadId = null, ?string $threadId = null, $attachment = null)
    {
        if (!$this->setUser($user)) {
            return ['status' => 'failed', 'error' => 'Gmail not connected or token expired'];
        }

        $trackToken = bin2hex(random_bytes(16));
        $trackUrl = rtrim(config('app.url'), '/') . '/api/emails/track/' . $trackToken;
        $pixel = '<img src="' . $trackUrl . '" width="1" height="1" alt="" style="display:none" />';
        $bodyToSend = strpos($body, '</body>') !== false
            ? str_replace('</body>', $pixel . '</body>', $body)
            : $body . $pixel;

        $gmail = new Gmail($this->client);

        $strRawMessage = "From: {$user->gmail_email}\r\n";
        $strRawMessage .= "To: {$to}\r\n";
        $strRawMessage .= "Subject: {$subject}\r\n";
        $strRawMessage .= "MIME-Version: 1.0\r\n";

        if ($attachment && $attachment->isValid()) {
            $boundary = '----=_Part_' . uniqid();
            $strRawMessage .= "Content-Type: multipart/mixed; boundary=\"{$boundary}\"\r\n\r\n";
            $strRawMessage .= "--{$boundary}\r\n";
            $strRawMessage .= "Content-Type: text/html; charset=utf-8\r\n\r\n";
            $strRawMessage .= $bodyToSend . "\r\n";
            $filename = $attachment->getClientOriginalName();
            $mimeType = $attachment->getMimeType() ?: 'application/octet-stream';
            $strRawMessage .= "--{$boundary}\r\n";
            $strRawMessage .= "Content-Type: {$mimeType}; name=\"" . addslashes($filename) . "\"\r\n";
            $strRawMessage .= "Content-Disposition: attachment; filename=\"" . addslashes($filename) . "\"\r\n";
            $strRawMessage .= "Content-Transfer-Encoding: base64\r\n\r\n";
            $strRawMessage .= chunk_split(base64_encode($attachment->get())) . "\r\n";
            $strRawMessage .= "--{$boundary}--";
        } else {
            $strRawMessage .= "Content-Type: text/html; charset=utf-8\r\n\r\n";
            $strRawMessage .= $bodyToSend;
        }

        $mimeMessage = base64_encode($strRawMessage);
        $mimeMessage = str_replace(['+', '/', '='], ['-', '_', ''], $mimeMessage);

        $message = new Message();
        $message->setRaw($mimeMessage);
        if ($threadId) {
            $message->setThreadId($threadId);
        }

        try {
            $sentMessage = $gmail->users_messages->send('me', $message);

            CrmEmail::create([
                'lead_id' => $leadId,
                'from_email' => $user->gmail_email,
                'to_email' => $to,
                'subject' => $subject,
                'body' => $body,
                'thread_id' => $sentMessage->getThreadId(),
                'gmail_message_id' => $sentMessage->getId(),
                'direction' => 'outbound',
                'status' => 'sent',
                'track_token' => $trackToken,
            ]);

            return ['status' => 'success', 'message_id' => $sentMessage->getId()];
        } catch (\Exception $e) {
            Log::error("Gmail send failed: " . $e->getMessage());
            
            CrmEmail::create([
                'lead_id' => $leadId,
                'from_email' => $user->gmail_email,
                'to_email' => $to,
                'subject' => $subject,
                'body' => $body,
                'direction' => 'outbound',
                'status' => 'failed',
            ]);

            return ['status' => 'failed', 'error' => $e->getMessage()];
        }
    }

    public function syncInbox(User $user)
    {
        if (!$this->setUser($user)) {
            return false;
        }

        $gmail = new Gmail($this->client);

        foreach ($gmail->users_messages->listUsersMessages('me', ['q' => 'is:inbox', 'maxResults' => 50])->getMessages() as $messageSummary) {
            $msg = $gmail->users_messages->get('me', $messageSummary->getId());
            $payload = $msg->getPayload();
            $headers = $payload->getHeaders();

            $from = '';
            $to = '';
            $subject = '';
            foreach ($headers as $header) {
                if ($header->getName() == 'From') $from = $header->getValue();
                if ($header->getName() == 'To') $to = $header->getValue();
                if ($header->getName() == 'Subject') $subject = $header->getValue();
            }

            // Extract email address from "Name <email@example.com>"
            preg_match('/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/i', $from, $matches);
            $fromEmail = $matches[0] ?? $from;

            // Find lead by sender email, scoped to user's company
            $lead = \App\Modules\Leads\Domain\Entities\Lead::withoutGlobalScopes()
                ->where('email', $fromEmail)
                ->when($user->company_id, fn ($q) => $q->where('company_id', $user->company_id))
                ->first();

            // Check if already exists
            if (CrmEmail::where('gmail_message_id', $msg->getId())->exists()) {
                continue;
            }

            $body = $this->getMessageBody($payload);

            CrmEmail::create([
                'lead_id' => $lead ? $lead->id : null,
                'from_email' => $fromEmail,
                'to_email' => $user->gmail_email,
                'subject' => $subject,
                'body' => $body,
                'thread_id' => $msg->getThreadId(),
                'gmail_message_id' => $msg->getId(),
                'direction' => 'inbound',
                'status' => 'received',
            ]);
        }

        try {
            foreach ($gmail->users_messages->listUsersMessages('me', ['q' => 'in:sent', 'maxResults' => 50])->getMessages() as $messageSummary) {
                if (CrmEmail::where('gmail_message_id', $messageSummary->getId())->exists()) {
                    continue;
                }
                $msg = $gmail->users_messages->get('me', $messageSummary->getId());
                $payload = $msg->getPayload();
                $headers = $payload->getHeaders();
                $from = '';
                $to = '';
                $subject = '';
                foreach ($headers as $header) {
                    if ($header->getName() == 'From') $from = $header->getValue();
                    if ($header->getName() == 'To') $to = $header->getValue();
                    if ($header->getName() == 'Subject') $subject = $header->getValue();
                }
                preg_match('/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}/i', $to, $toMatches);
                $toEmail = $toMatches[0] ?? $to;
                $lead = \App\Modules\Leads\Domain\Entities\Lead::withoutGlobalScopes()
                    ->where('email', $toEmail)
                    ->when($user->company_id, fn ($q) => $q->where('company_id', $user->company_id))
                    ->first();
                $body = $this->getMessageBody($payload);
                CrmEmail::create([
                    'lead_id' => $lead ? $lead->id : null,
                    'from_email' => $user->gmail_email,
                    'to_email' => $toEmail,
                    'subject' => $subject,
                    'body' => $body,
                    'thread_id' => $msg->getThreadId(),
                    'gmail_message_id' => $msg->getId(),
                    'direction' => 'outbound',
                    'status' => 'sent',
                ]);
            }
        } catch (\Throwable $e) {
            Log::warning('Gmail sync sent folder: ' . $e->getMessage());
        }

        return true;
    }

    protected function getMessageBody($payload)
    {
        $body = '';
        if ($payload->getBody()->getData()) {
            $body = base64_decode(str_replace(['-', '_'], ['+', '/'], $payload->getBody()->getData()));
        } else {
            $parts = $payload->getParts();
            foreach ($parts as $part) {
                if ($part->getMimeType() == 'text/html') {
                    $body = base64_decode(str_replace(['-', '_'], ['+', '/'], $part->getBody()->getData()));
                    break;
                }
                if ($part->getMimeType() == 'text/plain' && !$body) {
                    $body = base64_decode(str_replace(['-', '_'], ['+', '/'], $part->getBody()->getData()));
                }
            }
        }
        return $body;
    }
}
