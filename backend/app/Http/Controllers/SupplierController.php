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
            'city' => 'nullable|string|max:255',
            'company_name' => 'nullable|string|max:255',
            'title' => 'nullable|string|max:50',
            'first_name' => 'required|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone_code' => 'nullable|string|max:20',
            'mobile' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'status' => 'nullable|string|max:20',
        ];
    }

    protected function formatResource($resource)
    {
        return [
            'id' => $resource->id,
            'name' => trim("{$resource->title} {$resource->first_name} {$resource->last_name}"),
            'first_name' => $resource->first_name,
            'last_name' => $resource->last_name,
            'email' => $resource->email,
            'company' => $resource->company_name,
            'company_name' => $resource->company_name,
            'city' => $resource->city,
            'code' => $resource->phone_code,
            'phone_code' => $resource->phone_code,
            'mobile' => $resource->mobile,
            'title' => $resource->title,
            'address' => $resource->address,
            'status' => $resource->status ?: 'active',
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
