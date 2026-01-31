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
        $accessToken = [
            'access_token' => $user->google_token,
            'refresh_token' => $user->google_refresh_token,
            'expires_in' => Carbon::now()->diffInSeconds($user->google_token_expires_at, false),
            'created' => Carbon::parse($user->google_token_expires_at)->subSeconds(3600)->timestamp,
        ];

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

    public function sendMail(User $user, $to, $subject, $body, $leadId = null)
    {
        if (!$this->setUser($user)) {
            return ['status' => 'failed', 'error' => 'Gmail not connected or token expired'];
        }

        $gmail = new Gmail($this->client);
        
        $strRawMessage = "From: {$user->gmail_email}\r\n";
        $strRawMessage .= "To: {$to}\r\n";
        $strRawMessage .= "Subject: {$subject}\r\n";
        $strRawMessage .= "MIME-Version: 1.0\r\n";
        $strRawMessage .= "Content-Type: text/html; charset=utf-8\r\n\r\n";
        $strRawMessage .= $body;

        $mimeMessage = base64_encode($strRawMessage);
        $mimeMessage = str_replace(['+', '/', '='], ['-', '_', ''], $mimeMessage);

        $message = new Message();
        $message->setRaw($mimeMessage);

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
        $results = $gmail->users_messages->listUsersMessages('me', ['q' => 'is:inbox', 'maxResults' => 10]);

        foreach ($results->getMessages() as $messageSummary) {
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
