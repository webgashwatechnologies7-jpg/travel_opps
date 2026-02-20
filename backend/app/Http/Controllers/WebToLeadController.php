<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Company;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\User;
use Illuminate\Support\Facades\Validator;
use Illuminate\Http\JsonResponse;

class WebToLeadController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'api_key' => 'required|string',
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'destination' => 'required|string|max:255',
            'source' => 'nullable|string|max:255',
            'campaign_name' => 'nullable|string|max:255',
            'page_url' => 'nullable|string|max:1000',
            'remark' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find company by api_key
        $company = Company::where('api_key', $request->api_key)->first();

        if (!$company) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid API Key'
            ], 401);
        }

        // Find an active user in the company to assign the lead to.
        $assignedUser = User::where('company_id', $company->id)
            ->where('is_active', 1)
            ->orderBy('id', 'asc') // Usually first user is the admin
            ->first();

        if (!$assignedUser) {
            return response()->json([
                'success' => false,
                'message' => 'No active user found in this company to receive the lead'
            ], 400);
        }

        $sourceStr = $request->source ?? 'Website';

        $remarkText = '';
        if ($request->campaign_name) {
            $remarkText .= "Campaign: " . $request->campaign_name . "\n";
        }
        if ($request->page_url) {
            $remarkText .= "Page URL: " . $request->page_url . "\n";
        }
        if ($request->has('remark')) {
            $remarkText .= "Note: " . $request->remark . "\n";
        }

        $lead = Lead::create([
            'company_id' => $company->id,
            'client_name' => $request->name,
            'phone' => $request->phone,
            'email' => $request->email,
            'destination' => $request->destination,
            'source' => $sourceStr,
            'status' => 'New',
            'remark' => trim($remarkText),
            'assigned_to' => $assignedUser->id,
            'created_by' => $assignedUser->id,
            'client_type' => 'B2C',
        ]);

        // Trigger Bell icon notification event
        try {
            $assignedUser->notify(new \App\Notifications\GenericNotification([
                'type' => 'lead',
                'title' => 'New Lead from Website',
                'message' => 'A new lead for ' . $lead->destination . ' has been assigned to you.',
                'action_url' => '/leads/' . $lead->id,
            ]));
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Notification dispatch failed for Web-to-Lead: ' . $e->getMessage());
        }
        return response()->json([
            'success' => true,
            'message' => 'Lead created successfully',
            'data' => [
                'lead_id' => $lead->id
            ]
        ], 201);
    }
}
