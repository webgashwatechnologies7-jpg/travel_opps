<?php

namespace App\Http\Controllers;

use App\Models\LeadSource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class LeadSourceController extends Controller
{
    /**
     * Get all lead sources.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $leadSources = LeadSource::with('creator')
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($leadSource) {
                    return [
                        'id' => $leadSource->id,
                        'name' => $leadSource->name,
                        'status' => $leadSource->status,
                        'created_by' => $leadSource->created_by,
                        'created_by_name' => $leadSource->creator ? $leadSource->creator->name : 'Travbizz Travel IT Solutions',
                        'last_update' => $leadSource->updated_at ? $leadSource->updated_at->format('d-m-Y') : null,
                        'updated_at' => $leadSource->updated_at,
                        'created_at' => $leadSource->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Lead sources retrieved successfully',
                'data' => $leadSources,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving lead sources',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new lead source.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'status' => 'nullable|in:active,inactive',
            ], [
                'name.required' => 'The name field is required.',
                'status.in' => 'The status must be either active or inactive.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $leadSource = LeadSource::create([
                'name' => $request->name,
                'status' => $request->status ?? 'active',
                'created_by' => $request->user()->id,
            ]);

            $leadSource->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Lead source created successfully',
                'data' => [
                    'id' => $leadSource->id,
                    'name' => $leadSource->name,
                    'status' => $leadSource->status,
                    'created_by' => $leadSource->created_by,
                    'created_by_name' => $leadSource->creator ? $leadSource->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $leadSource->updated_at ? $leadSource->updated_at->format('d-m-Y') : null,
                    'updated_at' => $leadSource->updated_at,
                    'created_at' => $leadSource->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating lead source',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific lead source.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $leadSource = LeadSource::with('creator')->find($id);

            if (!$leadSource) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead source not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Lead source retrieved successfully',
                'data' => [
                    'id' => $leadSource->id,
                    'name' => $leadSource->name,
                    'status' => $leadSource->status,
                    'created_by' => $leadSource->created_by,
                    'created_by_name' => $leadSource->creator ? $leadSource->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $leadSource->updated_at ? $leadSource->updated_at->format('d-m-Y') : null,
                    'updated_at' => $leadSource->updated_at,
                    'created_at' => $leadSource->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving lead source',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a lead source.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $leadSource = LeadSource::find($id);

            if (!$leadSource) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead source not found',
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'status' => 'sometimes|in:active,inactive',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $updateData = [
                'name' => $request->has('name') ? $request->name : $leadSource->name,
                'status' => $request->has('status') ? $request->status : $leadSource->status,
            ];

            $leadSource->update($updateData);
            $leadSource->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Lead source updated successfully',
                'data' => [
                    'id' => $leadSource->id,
                    'name' => $leadSource->name,
                    'status' => $leadSource->status,
                    'created_by' => $leadSource->created_by,
                    'created_by_name' => $leadSource->creator ? $leadSource->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $leadSource->updated_at ? $leadSource->updated_at->format('d-m-Y') : null,
                    'updated_at' => $leadSource->updated_at,
                    'created_at' => $leadSource->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating lead source',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a lead source.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $leadSource = LeadSource::find($id);

            if (!$leadSource) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead source not found',
                ], 404);
            }

            $leadSource->delete();

            return response()->json([
                'success' => true,
                'message' => 'Lead source deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting lead source',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

