<?php

namespace App\Modules\Automation\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Automation\Infrastructure\ExternalServices\WhatsappService;
use App\Modules\Leads\Domain\Entities\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class WhatsappController extends Controller
{
    /**
     * @var WhatsappService
     */
    protected WhatsappService $whatsappService;

    /**
     * WhatsappController constructor.
     *
     * @param WhatsappService $whatsappService
     */
    public function __construct(WhatsappService $whatsappService)
    {
        $this->whatsappService = $whatsappService;
    }

    /**
     * Send WhatsApp message to a lead.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function send(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'lead_id' => 'required|integer|exists:leads,id',
                'message' => 'required|string|max:1000',
            ], [
                'lead_id.required' => 'The lead_id field is required.',
                'lead_id.integer' => 'The lead_id must be an integer.',
                'lead_id.exists' => 'The selected lead does not exist.',
                'message.required' => 'The message field is required.',
                'message.string' => 'The message must be a string.',
                'message.max' => 'The message may not be greater than 1000 characters.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Fetch lead
            $lead = Lead::find($request->input('lead_id'));

            if (!$lead) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            // Check if lead has phone number
            if (empty($lead->phone)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead does not have a phone number',
                ], 400);
            }

            // Send WhatsApp message
            $result = $this->whatsappService->sendMessage(
                $lead->phone,
                $request->input('message'),
                $lead->id
            );

            if ($result) {
                return response()->json([
                    'success' => true,
                    'message' => 'WhatsApp message sent successfully',
                    'data' => [
                        'lead_id' => $lead->id,
                        'client_name' => $lead->client_name,
                        'phone' => $lead->phone,
                        'message' => $request->input('message'),
                    ],
                ], 200);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send WhatsApp message',
                ], 500);
            }

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while sending WhatsApp message',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

