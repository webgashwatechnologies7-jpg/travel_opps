<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class CurrencyController extends Controller
{
    /**
     * Get all currencies.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $currencies = Currency::with('creator')
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($currency) {
                    return [
                        'id' => $currency->id,
                        'name' => $currency->name,
                        'rate' => $currency->rate,
                        'status' => $currency->status,
                        'created_by' => $currency->created_by,
                        'created_by_name' => $currency->creator ? $currency->creator->name : 'Travbizz Travel IT Solutions',
                        'last_update' => $currency->updated_at ? $currency->updated_at->format('d-m-Y') : null,
                        'updated_at' => $currency->updated_at,
                        'created_at' => $currency->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Currencies retrieved successfully',
                'data' => $currencies,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving currencies',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new currency.
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
                'rate' => 'required|numeric|min:0',
                'status' => 'nullable|in:active,inactive',
            ], [
                'name.required' => 'The name field is required.',
                'rate.required' => 'The rate field is required.',
                'rate.numeric' => 'The rate must be a number.',
                'rate.min' => 'The rate must be at least 0.',
                'status.in' => 'The status must be either active or inactive.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $currency = Currency::create([
                'name' => $request->name,
                'rate' => $request->rate,
                'status' => $request->status ?? 'active',
                'created_by' => $request->user()->id,
            ]);

            $currency->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Currency created successfully',
                'data' => [
                    'id' => $currency->id,
                    'name' => $currency->name,
                    'rate' => $currency->rate,
                    'status' => $currency->status,
                    'created_by' => $currency->created_by,
                    'created_by_name' => $currency->creator ? $currency->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $currency->updated_at ? $currency->updated_at->format('d-m-Y') : null,
                    'updated_at' => $currency->updated_at,
                    'created_at' => $currency->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating currency',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific currency.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $currency = Currency::with('creator')->find($id);

            if (!$currency) {
                return response()->json([
                    'success' => false,
                    'message' => 'Currency not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Currency retrieved successfully',
                'data' => [
                    'id' => $currency->id,
                    'name' => $currency->name,
                    'rate' => $currency->rate,
                    'status' => $currency->status,
                    'created_by' => $currency->created_by,
                    'created_by_name' => $currency->creator ? $currency->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $currency->updated_at ? $currency->updated_at->format('d-m-Y') : null,
                    'updated_at' => $currency->updated_at,
                    'created_at' => $currency->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving currency',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a currency.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $currency = Currency::find($id);

            if (!$currency) {
                return response()->json([
                    'success' => false,
                    'message' => 'Currency not found',
                ], 404);
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'rate' => 'sometimes|required|numeric|min:0',
                'status' => 'sometimes|in:active,inactive',
            ], [
                'name.required' => 'The name field is required.',
                'rate.required' => 'The rate field is required.',
                'rate.numeric' => 'The rate must be a number.',
                'rate.min' => 'The rate must be at least 0.',
                'status.in' => 'The status must be either active or inactive.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $updateData = [];
            if ($request->has('name')) {
                $updateData['name'] = $request->name;
            }
            if ($request->has('rate')) {
                $updateData['rate'] = $request->rate;
            }
            if ($request->has('status')) {
                $updateData['status'] = $request->status;
            }

            $currency->update($updateData);
            $currency->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Currency updated successfully',
                'data' => [
                    'id' => $currency->id,
                    'name' => $currency->name,
                    'rate' => $currency->rate,
                    'status' => $currency->status,
                    'created_by' => $currency->created_by,
                    'created_by_name' => $currency->creator ? $currency->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $currency->updated_at ? $currency->updated_at->format('d-m-Y') : null,
                    'updated_at' => $currency->updated_at,
                    'created_at' => $currency->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating currency',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a currency.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $currency = Currency::find($id);

            if (!$currency) {
                return response()->json([
                    'success' => false,
                    'message' => 'Currency not found',
                ], 404);
            }

            $currency->delete();

            return response()->json([
                'success' => true,
                'message' => 'Currency deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting currency',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

