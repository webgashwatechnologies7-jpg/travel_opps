<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SendUserCredentials extends Mailable
{
    use Queueable, SerializesModels;

    public $email;
    public $password;
    public $loginUrl;
    public $companyName;
    public $crmUrl;

    /**
     * Create a new message instance.
     */
    public function __construct($email, $password, $companyName = null, $crmUrl = null)
    {
        $this->email = $email;
        $this->password = $password;
        $this->companyName = $companyName;
        $this->crmUrl = $crmUrl ?? env('FRONTEND_LOGIN_URL', config('app.url') . '/login');
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your TravelOps CRM Login Details',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.send-user-credentials',
            with: [
                'email' => $this->email,
                'password' => $this->password,
                'loginUrl' => $this->loginUrl,
                'companyName' => $this->companyName,
                'crmUrl' => $this->crmUrl,
            ],
        );
    }
}

