<?php

namespace App\Http\Controllers;

use App\Models\ExpenseType;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExpenseTypeController extends Controller
{
    /**
     * Get all expense types.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $expenseTypes = ExpenseType::with('creator')
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($expenseType) {
                    return [
                        'id' => $expenseType->id,
                        'name' => $expenseType->name,
                        'status' => $expenseType->status,
                        'created_by' => $expenseType->created_by,
                        'created_by_name' => $expenseType->creator ? $expenseType->creator->name : 'Travbizz Travel IT Solutions',
                        'last_update' => $expenseType->updated_at ? $expenseType->updated_at->format('d-m-Y') : null,
                        'updated_at' => $expenseType->updated_at,
                        'created_at' => $expenseType->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Expense types retrieved successfully',
                'data' => $expenseTypes,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving expense types',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new expense type.
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

            $expenseType = ExpenseType::create([
                'name' => $request->name,
                'status' => $request->status ?? 'active',
                'created_by' => $request->user()->id,
            ]);

            $expenseType->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Expense type created successfully',
                'data' => [
                    'id' => $expenseType->id,
                    'name' => $expenseType->name,
                    'status' => $expenseType->status,
                    'created_by' => $expenseType->created_by,
                    'created_by_name' => $expenseType->creator ? $expenseType->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $expenseType->updated_at ? $expenseType->updated_at->format('d-m-Y') : null,
                    'updated_at' => $expenseType->updated_at,
                    'created_at' => $expenseType->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating expense type',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific expense type.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $expenseType = ExpenseType::with('creator')->find($id);

            if (!$expenseType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Expense type not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Expense type retrieved successfully',
                'data' => [
                    'id' => $expenseType->id,
                    'name' => $expenseType->name,
                    'status' => $expenseType->status,
                    'created_by' => $expenseType->created_by,
                    'created_by_name' => $expenseType->creator ? $expenseType->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $expenseType->updated_at ? $expenseType->updated_at->format('d-m-Y') : null,
                    'updated_at' => $expenseType->updated_at,
                    'created_at' => $expenseType->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving expense type',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update an expense type.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $expenseType = ExpenseType::find($id);

            if (!$expenseType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Expense type not found',
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
                'name' => $request->has('name') ? $request->name : $expenseType->name,
                'status' => $request->has('status') ? $request->status : $expenseType->status,
            ];

            $expenseType->update($updateData);
            $expenseType->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Expense type updated successfully',
                'data' => [
                    'id' => $expenseType->id,
                    'name' => $expenseType->name,
                    'status' => $expenseType->status,
                    'created_by' => $expenseType->created_by,
                    'created_by_name' => $expenseType->creator ? $expenseType->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $expenseType->updated_at ? $expenseType->updated_at->format('d-m-Y') : null,
                    'updated_at' => $expenseType->updated_at,
                    'created_at' => $expenseType->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating expense type',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete an expense type.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $expenseType = ExpenseType::find($id);

            if (!$expenseType) {
                return response()->json([
                    'success' => false,
                    'message' => 'Expense type not found',
                ], 404);
            }

            $expenseType->delete();

            return response()->json([
                'success' => true,
                'message' => 'Expense type deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting expense type',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

