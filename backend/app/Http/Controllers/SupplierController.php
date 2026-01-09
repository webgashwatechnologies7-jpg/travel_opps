<?php

namespace App\Http\Controllers;

use App\Models\Supplier;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class SupplierController extends Controller
{
    /**
     * Get all suppliers.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $suppliers = Supplier::orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($supplier) {
                    return [
                        'id' => $supplier->id,
                        'company' => $supplier->company_name,
                        'company_name' => $supplier->company_name,
                        'name' => $supplier->name,
                        'title' => $supplier->title,
                        'first_name' => $supplier->first_name,
                        'last_name' => $supplier->last_name,
                        'email' => $supplier->email,
                        'mobile' => $supplier->mobile ?: 'Not Provided',
                        'phone_code' => $supplier->phone_code,
                        'code' => $supplier->phone_code,
                        'location' => $supplier->location,
                        'city' => $supplier->city,
                        'address' => $supplier->address,
                        'last_update' => $supplier->updated_at ? $supplier->updated_at->format('d-m-Y') : null,
                        'updated_at' => $supplier->updated_at,
                        'created_at' => $supplier->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Suppliers retrieved successfully',
                'data' => $suppliers,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving suppliers',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new supplier.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'city' => 'nullable|string|max:255',
                'company_name' => 'required|string|max:255',
                'title' => 'nullable|in:Mr.,Mrs.,Ms.,Dr.',
                'first_name' => 'required|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone_code' => 'nullable|string|max:10',
                'code' => 'nullable|string|max:10',
                'mobile' => 'nullable|string|max:20',
                'address' => 'nullable|string',
            ], [
                'company_name.required' => 'The company name field is required.',
                'first_name.required' => 'The first name field is required.',
                'email.email' => 'The email must be a valid email address.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $supplier = Supplier::create([
                'city' => $request->city,
                'company_name' => $request->company_name,
                'title' => $request->title ?? $request->input('title', 'Mr.'),
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'phone_code' => $request->phone_code ?? $request->code ?? '+91',
                'mobile' => $request->mobile,
                'address' => $request->address,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Supplier created successfully',
                'data' => [
                    'id' => $supplier->id,
                    'company' => $supplier->company_name,
                    'company_name' => $supplier->company_name,
                    'name' => $supplier->name,
                    'title' => $supplier->title,
                    'first_name' => $supplier->first_name,
                    'last_name' => $supplier->last_name,
                    'email' => $supplier->email,
                    'mobile' => $supplier->mobile ?: 'Not Provided',
                    'phone_code' => $supplier->phone_code,
                    'code' => $supplier->phone_code,
                    'location' => $supplier->location,
                    'city' => $supplier->city,
                    'address' => $supplier->address,
                    'last_update' => $supplier->updated_at ? $supplier->updated_at->format('d-m-Y') : null,
                    'updated_at' => $supplier->updated_at,
                    'created_at' => $supplier->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating supplier',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific supplier.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $supplier = Supplier::find($id);

            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supplier not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Supplier retrieved successfully',
                'data' => [
                    'id' => $supplier->id,
                    'company' => $supplier->company_name,
                    'company_name' => $supplier->company_name,
                    'name' => $supplier->name,
                    'title' => $supplier->title,
                    'first_name' => $supplier->first_name,
                    'last_name' => $supplier->last_name,
                    'email' => $supplier->email,
                    'mobile' => $supplier->mobile ?: 'Not Provided',
                    'phone_code' => $supplier->phone_code,
                    'code' => $supplier->phone_code,
                    'location' => $supplier->location,
                    'city' => $supplier->city,
                    'address' => $supplier->address,
                    'last_update' => $supplier->updated_at ? $supplier->updated_at->format('d-m-Y') : null,
                    'updated_at' => $supplier->updated_at,
                    'created_at' => $supplier->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving supplier',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a supplier.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $supplier = Supplier::find($id);

            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supplier not found',
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'city' => 'nullable|string|max:255',
                'company_name' => 'sometimes|required|string|max:255',
                'title' => 'nullable|in:Mr.,Mrs.,Ms.,Dr.',
                'first_name' => 'sometimes|required|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone_code' => 'nullable|string|max:10',
                'code' => 'nullable|string|max:10',
                'mobile' => 'nullable|string|max:20',
                'address' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $supplier->update([
                'city' => $request->has('city') ? $request->city : $supplier->city,
                'company_name' => $request->has('company_name') ? $request->company_name : $supplier->company_name,
                'title' => $request->has('title') ? $request->title : $supplier->title,
                'first_name' => $request->has('first_name') ? $request->first_name : $supplier->first_name,
                'last_name' => $request->has('last_name') ? $request->last_name : $supplier->last_name,
                'email' => $request->has('email') ? $request->email : $supplier->email,
                'phone_code' => $request->has('phone_code') || $request->has('code') 
                    ? ($request->phone_code ?? $request->code) 
                    : $supplier->phone_code,
                'mobile' => $request->has('mobile') ? $request->mobile : $supplier->mobile,
                'address' => $request->has('address') ? $request->address : $supplier->address,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Supplier updated successfully',
                'data' => [
                    'id' => $supplier->id,
                    'company' => $supplier->company_name,
                    'company_name' => $supplier->company_name,
                    'name' => $supplier->name,
                    'title' => $supplier->title,
                    'first_name' => $supplier->first_name,
                    'last_name' => $supplier->last_name,
                    'email' => $supplier->email,
                    'mobile' => $supplier->mobile ?: 'Not Provided',
                    'phone_code' => $supplier->phone_code,
                    'code' => $supplier->phone_code,
                    'location' => $supplier->location,
                    'city' => $supplier->city,
                    'address' => $supplier->address,
                    'last_update' => $supplier->updated_at ? $supplier->updated_at->format('d-m-Y') : null,
                    'updated_at' => $supplier->updated_at,
                    'created_at' => $supplier->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating supplier',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a supplier.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $supplier = Supplier::find($id);

            if (!$supplier) {
                return response()->json([
                    'success' => false,
                    'message' => 'Supplier not found',
                ], 404);
            }

            $supplier->delete();

            return response()->json([
                'success' => true,
                'message' => 'Supplier deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting supplier',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Send email to selected suppliers.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function sendEmail(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'supplier_ids' => 'nullable|array',
                'supplier_ids.*' => 'required|exists:suppliers,id',
                'hotel_emails' => 'nullable|array',
                'hotel_emails.*.email' => 'required|email',
                'subject' => 'required|string|max:255',
                'cc_email' => 'nullable|email|max:255',
                'body' => 'required|string',
                'enquiry_details' => 'nullable|array',
                'lead_id' => 'nullable|exists:leads,id',
            ], [
                'supplier_ids.min' => 'Please select at least one supplier or hotel.',
                'subject.required' => 'The subject field is required.',
                'body.required' => 'The email body is required.',
            ]);

            if (empty($request->supplier_ids) && empty($request->hotel_emails)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Please select at least one supplier or hotel.',
                ], 422);
            }

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $suppliers = [];
            if (!empty($request->supplier_ids)) {
                $suppliers = Supplier::whereIn('id', $request->supplier_ids)->get();
            }
            
            $hotelEmails = $request->hotel_emails ?? [];
            $sentCount = 0;
            $failedCount = 0;
            $errors = [];

            // Get company settings for email header
            $companyLogo = Setting::getValue('company_logo', '');
            $companyName = Setting::getValue('company_name', config('app.name', 'TravelOps'));
            $companyEmail = Setting::getValue('company_email', config('mail.from.address', ''));
            $companyPhone = Setting::getValue('company_phone', '');
            $companyAddress = Setting::getValue('company_address', '');

            // Build beautiful email HTML template with header
            $emailBody = '
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>' . htmlspecialchars($request->subject) . '</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f5;">
                    <tr>
                        <td align="center" style="padding: 20px 0;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <!-- Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td align="center">';
            
            if ($companyLogo) {
                $emailBody .= '<img src="' . htmlspecialchars($companyLogo) . '" alt="' . htmlspecialchars($companyName) . '" style="max-width: 150px; height: auto; margin-bottom: 15px;" />';
            }
            
            $emailBody .= '<h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">' . htmlspecialchars($companyName) . '</h1>';
            
            if ($companyEmail || $companyPhone) {
                $emailBody .= '<p style="margin: 10px 0 0 0; color: #ffffff; font-size: 14px;">';
                if ($companyEmail) {
                    $emailBody .= htmlspecialchars($companyEmail);
                }
                if ($companyEmail && $companyPhone) {
                    $emailBody .= ' | ';
                }
                if ($companyPhone) {
                    $emailBody .= htmlspecialchars($companyPhone);
                }
                $emailBody .= '</p>';
            }
            
            $emailBody .= '
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Body Content -->
                                <tr>
                                    <td style="padding: 30px;">
                                        <div style="color: #333333; font-size: 16px; line-height: 1.6;">
                                            ' . nl2br(e($request->body)) . '
                                        </div>';
            
            // Add enquiry details table if available
            if ($request->has('enquiry_details') && is_array($request->enquiry_details)) {
                $details = $request->enquiry_details;
                
                $emailBody .= '
                                        <div style="margin-top: 30px;">
                                            <h2 style="color: #667eea; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Enquiry Details</h2>
                                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border-collapse: collapse; background-color: #f9f9f9; border-radius: 6px; overflow: hidden;">
                                                <tr>
                                                    <td style="padding: 12px; font-weight: bold; background-color: #667eea; color: #ffffff; width: 30%;">Customer Name</td>
                                                    <td style="padding: 12px; background-color: #ffffff; color: #333333;">' . htmlspecialchars($details['customer_name'] ?? 'N/A') . '</td>
                                                    <td style="padding: 12px; font-weight: bold; background-color: #667eea; color: #ffffff; width: 30%;">Enquiry ID</td>
                                                    <td style="padding: 12px; background-color: #ffffff; color: #333333;">' . htmlspecialchars($details['enquiry_id'] ?? 'N/A') . '</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px; font-weight: bold; background-color: #667eea; color: #ffffff;">Enquiry For</td>
                                                    <td style="padding: 12px; background-color: #ffffff; color: #333333;">' . htmlspecialchars($details['enquiry_for'] ?? 'N/A') . '</td>
                                                    <td style="padding: 12px; font-weight: bold; background-color: #667eea; color: #ffffff;">Nights</td>
                                                    <td style="padding: 12px; background-color: #ffffff; color: #333333;">' . htmlspecialchars($details['nights'] ?? 'N/A') . '</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px; font-weight: bold; background-color: #667eea; color: #ffffff;">Check-In</td>
                                                    <td style="padding: 12px; background-color: #ffffff; color: #333333;">' . htmlspecialchars($details['check_in'] ?? 'N/A') . '</td>
                                                    <td style="padding: 12px; font-weight: bold; background-color: #667eea; color: #ffffff;">Check-Out</td>
                                                    <td style="padding: 12px; background-color: #ffffff; color: #333333;">' . htmlspecialchars($details['check_out'] ?? 'N/A') . '</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding: 12px; font-weight: bold; background-color: #667eea; color: #ffffff;">Pax</td>
                                                    <td colspan="3" style="padding: 12px; background-color: #ffffff; color: #333333;">
                                                        Adult: ' . htmlspecialchars($details['adult'] ?? '1') . ' | 
                                                        Child: ' . htmlspecialchars($details['child'] ?? '0') . ' | 
                                                        Infant: ' . htmlspecialchars($details['infant'] ?? '0') . '
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>';

                // Add hotel details if available
                if (isset($details['hotels']) && is_array($details['hotels']) && count($details['hotels']) > 0) {
                    $emailBody .= '
                                        <div style="margin-top: 30px;">
                                            <h2 style="color: #667eea; font-size: 20px; margin-bottom: 15px; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Hotel Requirements</h2>
                                            <div style="background-color: #f9f9f9; border-radius: 6px; padding: 15px;">';
                    
                    foreach ($details['hotels'] as $index => $hotel) {
                        $hotelInfo = [];
                        if (isset($hotel['hotel_name'])) $hotelInfo[] = htmlspecialchars($hotel['hotel_name']);
                        if (isset($hotel['room_type'])) $hotelInfo[] = htmlspecialchars($hotel['room_type']);
                        if (isset($hotel['meal_plan'])) $hotelInfo[] = htmlspecialchars($hotel['meal_plan']);
                        $price = isset($hotel['price']) ? '₹' . htmlspecialchars($hotel['price']) : '';
                        
                        $emailBody .= '
                                                <div style="background-color: #ffffff; padding: 15px; margin-bottom: 10px; border-left: 4px solid #667eea; border-radius: 4px;">
                                                    <div style="font-weight: bold; color: #333333; font-size: 16px; margin-bottom: 5px;">
                                                        ' . ($index + 1) . '. ' . implode(' - ', $hotelInfo) . '
                                                    </div>';
                        
                        if ($price) {
                            $emailBody .= '<div style="color: #667eea; font-weight: bold; font-size: 14px;">Price: ' . $price . '</div>';
                        }
                        
                        $emailBody .= '
                                                </div>';
                    }
                    
                    $emailBody .= '
                                            </div>
                                        </div>';
                }
            }
            
            // Close body and add footer
            $emailBody .= '
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #e0e0e0;">
                                        <p style="margin: 0; color: #666666; font-size: 12px;">
                                            <strong>' . htmlspecialchars($companyName) . '</strong><br>';
            
            if ($companyAddress) {
                $emailBody .= htmlspecialchars($companyAddress) . '<br>';
            }
            
            if ($companyEmail) {
                $emailBody .= 'Email: <a href="mailto:' . htmlspecialchars($companyEmail) . '" style="color: #667eea; text-decoration: none;">' . htmlspecialchars($companyEmail) . '</a>';
            }
            
            if ($companyPhone) {
                if ($companyEmail) $emailBody .= ' | ';
                $emailBody .= 'Phone: ' . htmlspecialchars($companyPhone);
            }
            
            $emailBody .= '
                                        </p>
                                        <p style="margin: 10px 0 0 0; color: #999999; font-size: 11px;">
                                            This is an automated email. Please do not reply directly to this message.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>';

            // Send emails to suppliers
            foreach ($suppliers as $supplier) {
                if (!$supplier->email) {
                    $failedCount++;
                    $errors[] = "Supplier {$supplier->company_name} does not have an email address.";
                    continue;
                }

                try {
                    $fromEmail = $companyEmail ?: config('mail.from.address', 'noreply@travelops.com');
                    $fromName = $companyName ?: config('mail.from.name', 'TravelOps');
                    
                    Mail::send([], [], function ($message) use ($supplier, $request, $emailBody, $fromEmail, $fromName) {
                        $message->from($fromEmail, $fromName)
                            ->to($supplier->email)
                            ->subject($request->subject)
                            ->html($emailBody);
                        
                        if ($request->cc_email) {
                            $message->cc($request->cc_email);
                        }
                    });
                    $sentCount++;
                } catch (\Exception $e) {
                    $failedCount++;
                    $errors[] = "Failed to send email to {$supplier->company_name}: " . $e->getMessage();
                    Log::error('Supplier email send failed', [
                        'supplier_id' => $supplier->id,
                        'supplier_email' => $supplier->email,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            }

            // Send emails to hotels
            foreach ($hotelEmails as $hotel) {
                if (empty($hotel['email'])) {
                    $failedCount++;
                    $hotelName = $hotel['name'] ?? 'Unknown';
                    $errors[] = "Hotel {$hotelName} does not have an email address.";
                    continue;
                }

                try {
                    $fromEmail = $companyEmail ?: config('mail.from.address', 'noreply@travelops.com');
                    $fromName = $companyName ?: config('mail.from.name', 'TravelOps');
                    
                    Mail::send([], [], function ($message) use ($hotel, $request, $emailBody, $fromEmail, $fromName) {
                        $message->from($fromEmail, $fromName)
                            ->to($hotel['email'])
                            ->subject($request->subject)
                            ->html($emailBody);
                        
                        if ($request->cc_email) {
                            $message->cc($request->cc_email);
                        }
                    });
                    $sentCount++;
                } catch (\Exception $e) {
                    $failedCount++;
                    $hotelName = $hotel['name'] ?? 'Hotel';
                    $errors[] = "Failed to send email to {$hotelName}: " . $e->getMessage();
                    Log::error('Hotel email send failed', [
                        'hotel_email' => $hotel['email'],
                        'hotel_name' => $hotel['name'] ?? 'Unknown',
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString(),
                    ]);
                }
            }

            if ($sentCount === 0 && $failedCount > 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send emails. Please check mail configuration and try again.',
                    'data' => [
                        'sent_count' => $sentCount,
                        'failed_count' => $failedCount,
                        'errors' => $errors,
                    ],
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => "Email sent successfully to {$sentCount} recipient(s)" . ($failedCount > 0 ? ". {$failedCount} failed." : ''),
                'data' => [
                    'sent_count' => $sentCount,
                    'failed_count' => $failedCount,
                    'errors' => $errors,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending emails',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}
