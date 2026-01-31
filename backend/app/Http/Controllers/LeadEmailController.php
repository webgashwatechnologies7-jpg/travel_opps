<?php

namespace App\Http\Controllers;

use App\Models\LeadEmail;
use App\Models\Setting;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Services\CompanyMailSettingsService;

class LeadEmailController extends Controller
{
    /**
     * Get all emails for a lead.
     *
     * @param int $leadId
     * @return JsonResponse
     */
    public function index(int $leadId): JsonResponse
    {
        try {
            $lead = Lead::find($leadId);
            
            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            $emails = LeadEmail::where('lead_id', $leadId)
                ->with(['user:id,name,email'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Emails retrieved successfully',
                'data' => [
                    'emails' => $emails,
                    'lead_email' => $lead->email,
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve lead emails', [
                'lead_id' => $leadId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve emails',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Send email to client.
     *
     * @param Request $request
     * @param int $leadId
     * @return JsonResponse
     */
    public function send(Request $request, int $leadId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'to_email' => 'required|email',
                'cc_email' => 'nullable|email',
                'subject' => 'required|string|max:255',
                'body' => 'required|string',
                'attachment' => 'nullable|file|max:10240', // Max 10MB
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $lead = Lead::find($leadId);
            
            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            // Prefer Email Integration (company mail) From Name/Email when enabled — so sender shows company name and company email
            $mailSettings = CompanyMailSettingsService::getSettings();
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

            // Create email HTML with company branding
            $emailBody = '<!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>' . htmlspecialchars($request->subject) . '</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 30px 40px; text-align: center;">
                                        ' . ($companyLogo ? '<img src="' . $companyLogo . '" alt="' . htmlspecialchars($companyName) . '" style="max-height: 60px; margin-bottom: 10px;">' : '') . '
                                        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">' . htmlspecialchars($companyName) . '</h1>
                                    </td>
                                </tr>
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <div style="color: #333333; font-size: 15px; line-height: 1.6;">
                                            ' . nl2br(htmlspecialchars($request->body)) . '
                                        </div>
                                    </td>
                                </tr>
                                <!-- Footer -->
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

            // Send email
            $fromEmail = $companyEmail ?: config('mail.from.address', 'noreply@travelops.com');
            $fromName = $companyName ?: config('mail.from.name', 'TravelOps');

            try {
                CompanyMailSettingsService::applyIfEnabled();
                Mail::send([], [], function ($message) use ($request, $emailBody, $fromEmail, $fromName) {
                    $message->from($fromEmail, $fromName)
                        ->to($request->to_email)
                        ->subject($request->subject)
                        ->html($emailBody);
                    
                    if ($request->cc_email) {
                        $message->cc($request->cc_email);
                    }
                    
                    // Handle attachment
                    if ($request->hasFile('attachment')) {
                        $file = $request->file('attachment');
                        $message->attach($file->getRealPath(), [
                            'as' => $file->getClientOriginalName(),
                            'mime' => $file->getMimeType(),
                        ]);
                    }
                });

                // Save email record
                $email = LeadEmail::create([
                    'lead_id' => $leadId,
                    'user_id' => Auth::id(),
                    'to_email' => $request->to_email,
                    'cc_email' => $request->cc_email,
                    'subject' => $request->subject,
                    'body' => $request->body,
                    'type' => 'sent',
                    'status' => 'sent',
                    'sent_at' => now(),
                ]);

                return response()->json([
                    'success' => true,
                    'message' => 'Email sent successfully',
                    'data' => [
                        'email' => $email->load('user:id,name,email'),
                    ],
                ], 200);

            } catch (\Exception $e) {
                // Save failed email record
                LeadEmail::create([
                    'lead_id' => $leadId,
                    'user_id' => Auth::id(),
                    'to_email' => $request->to_email,
                    'cc_email' => $request->cc_email,
                    'subject' => $request->subject,
                    'body' => $request->body,
                    'type' => 'sent',
                    'status' => 'failed',
                ]);

                Log::error('Failed to send email to client', [
                    'lead_id' => $leadId,
                    'to_email' => $request->to_email,
                    'error' => $e->getMessage(),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send email: ' . $e->getMessage(),
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Failed to process email request', [
                'lead_id' => $leadId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process email request',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a single email.
     *
     * @param int $leadId
     * @param int $emailId
     * @return JsonResponse
     */
    public function show(int $leadId, int $emailId): JsonResponse
    {
        try {
            $email = LeadEmail::where('lead_id', $leadId)
                ->where('id', $emailId)
                ->with(['user:id,name,email'])
                ->first();

            if (!$email) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Email retrieved successfully',
                'data' => [
                    'email' => $email,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve email',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

