<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Traits\GenericCrudTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use App\Services\CompanyMailSettingsService;

class SupplierController extends Controller
{
    use GenericCrudTrait;

    protected function getModel()
    {
        return Supplier::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'category' => 'nullable|string|max:50',
            'contact_person' => 'nullable|string|max:255',
            'address' => 'nullable|string',
            'bank_details' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ];
    }

    protected function formatResource($resource)
    {
        return [
            'id' => $resource->id,
            'name' => $resource->name,
            'email' => $resource->email,
            'phone' => $resource->phone,
            'category' => $resource->category,
            'contact_person' => $resource->contact_person,
            'address' => $resource->address,
            'bank_details' => $resource->bank_details,
            'status' => $resource->status,
            'created_at' => $resource->created_at,
            'updated_at' => $resource->updated_at,
        ];
    }

    /**
     * Send email to selected suppliers.
     */
    public function sendEmail(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'suppliers' => 'required|array',
                'suppliers.*.email' => 'required|email',
                'subject' => 'required|string',
                'body' => 'required|string',
                'cc' => 'nullable|string',
                'attachments' => 'nullable|array',
            ]);

            $sentCount = 0;
            $errors = [];

            // Configure mail settings for the company
            $mailService = new CompanyMailSettingsService();
            $configStatus = $mailService->configureMailSettings($request->user()->company_id);

            foreach ($validated['suppliers'] as $supplier) {
                try {
                    $toEmail = $supplier['email'];
                    $subject = $validated['subject'];
                    $body = $validated['body'];
                    $cc = $validated['cc'] ? array_map('trim', explode(',', $validated['cc'])) : [];

                    Mail::html($body, function ($message) use ($toEmail, $subject, $cc, $validated) {
                        $message->to($toEmail)
                            ->subject($subject);

                        if (!empty($cc)) {
                            $message->cc($cc);
                        }
                    });

                    $sentCount++;
                } catch (\Exception $e) {
                    $errors[] = "Failed to send to {$supplier['email']}: " . $e->getMessage();
                }
            }

            return response()->json([
                'success' => true,
                'message' => "Emails sent successfully to $sentCount suppliers.",
                'sent_count' => $sentCount,
                'errors' => $errors
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error sending emails',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
