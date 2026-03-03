<?php

namespace App\Modules\Calls\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Traits\StandardApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CompanyTelephonyController extends Controller
{
    use StandardApiResponse;

    public function getSettings(Request $request): JsonResponse
    {
        try {
            $company = $request->user()->company;
            if (!$company) {
                return $this->errorResponse('Company not found', 404);
            }

            return $this->successResponse([
                'telephony_provider' => $company->telephony_provider,
                'exotel_account_sid' => $company->exotel_account_sid,
                'exotel_api_key' => $company->exotel_api_key,
                'exotel_api_token' => $company->exotel_api_token,
                'exotel_subdomain' => $company->exotel_subdomain ?? 'api.exotel.com',
                'exotel_from_number' => $company->exotel_from_number,
                'exotel_webhook_secret' => $company->exotel_webhook_secret,
                'telephony_enabled' => (bool) $company->telephony_enabled,
                'telephony_status' => $company->telephony_status ?? 'pending',
            ], 'Telephony settings retrieved successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to retrieve telephony settings', $e);
        }
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'telephony_provider' => 'required|string|in:exotel,twilio',
            'exotel_account_sid' => 'required_if:telephony_provider,exotel|nullable|string',
            'exotel_api_key' => 'nullable|string',
            'exotel_api_token' => 'required_if:telephony_provider,exotel|nullable|string',
            'exotel_subdomain' => 'nullable|string',
            'exotel_from_number' => 'required_if:telephony_provider,exotel|nullable|string',
            'exotel_webhook_secret' => 'nullable|string',
            'telephony_enabled' => 'boolean',
        ]);

        if ($validator->fails()) {
            return $this->validationErrorResponse($validator);
        }

        try {
            $company = $request->user()->company;
            if (!$company) {
                return $this->errorResponse('Company not found', 404);
            }

            $data = $validator->validated();

            // Map form fields to DB columns
            $company->update([
                'telephony_provider' => $data['telephony_provider'],
                'exotel_account_sid' => $data['exotel_account_sid'] ?? null,
                'exotel_api_key' => $data['exotel_api_key'] ?? null,
                'exotel_api_token' => $data['exotel_api_token'] ?? null,
                'exotel_subdomain' => $data['exotel_subdomain'] ?? 'api.exotel.com',
                'exotel_from_number' => $data['exotel_from_number'] ?? null,
                'exotel_webhook_secret' => $data['exotel_webhook_secret'] ?? null,
                'telephony_enabled' => $data['telephony_enabled'] ?? false,
                'telephony_status' => 'active', // Mark as active once configured
            ]);

            return $this->successResponse(null, 'Telephony settings updated successfully');
        } catch (\Throwable $e) {
            return $this->serverErrorResponse('Failed to update telephony settings', $e);
        }
    }
}
