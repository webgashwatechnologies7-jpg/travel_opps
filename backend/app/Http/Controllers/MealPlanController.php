<?php

namespace App\Http\Controllers;

use App\Models\MealPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MealPlanController extends Controller
{
    /**
     * Get all meal plans.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $mealPlans = MealPlan::with('creator')
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($mealPlan) {
                    return [
                        'id' => $mealPlan->id,
                        'name' => $mealPlan->name,
                        'status' => $mealPlan->status,
                        'created_by' => $mealPlan->created_by,
                        'created_by_name' => $mealPlan->creator ? $mealPlan->creator->name : 'Travbizz Travel IT Solutions',
                        'last_update' => $mealPlan->updated_at ? $mealPlan->updated_at->format('d-m-Y') : null,
                        'updated_at' => $mealPlan->updated_at,
                        'created_at' => $mealPlan->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Meal plans retrieved successfully',
                'data' => $mealPlans,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving meal plans',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new meal plan.
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

            $mealPlan = MealPlan::create([
                'name' => $request->name,
                'status' => $request->status ?? 'active',
                'created_by' => $request->user()->id,
            ]);

            $mealPlan->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Meal plan created successfully',
                'data' => [
                    'id' => $mealPlan->id,
                    'name' => $mealPlan->name,
                    'status' => $mealPlan->status,
                    'created_by' => $mealPlan->created_by,
                    'created_by_name' => $mealPlan->creator ? $mealPlan->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $mealPlan->updated_at ? $mealPlan->updated_at->format('d-m-Y') : null,
                    'updated_at' => $mealPlan->updated_at,
                    'created_at' => $mealPlan->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating meal plan',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific meal plan.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $mealPlan = MealPlan::with('creator')->find($id);

            if (!$mealPlan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Meal plan not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Meal plan retrieved successfully',
                'data' => [
                    'id' => $mealPlan->id,
                    'name' => $mealPlan->name,
                    'status' => $mealPlan->status,
                    'created_by' => $mealPlan->created_by,
                    'created_by_name' => $mealPlan->creator ? $mealPlan->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $mealPlan->updated_at ? $mealPlan->updated_at->format('d-m-Y') : null,
                    'updated_at' => $mealPlan->updated_at,
                    'created_at' => $mealPlan->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving meal plan',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a meal plan.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $mealPlan = MealPlan::find($id);

            if (!$mealPlan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Meal plan not found',
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
                'name' => $request->has('name') ? $request->name : $mealPlan->name,
                'status' => $request->has('status') ? $request->status : $mealPlan->status,
            ];

            $mealPlan->update($updateData);
            $mealPlan->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Meal plan updated successfully',
                'data' => [
                    'id' => $mealPlan->id,
                    'name' => $mealPlan->name,
                    'status' => $mealPlan->status,
                    'created_by' => $mealPlan->created_by,
                    'created_by_name' => $mealPlan->creator ? $mealPlan->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $mealPlan->updated_at ? $mealPlan->updated_at->format('d-m-Y') : null,
                    'updated_at' => $mealPlan->updated_at,
                    'created_at' => $mealPlan->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating meal plan',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a meal plan.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $mealPlan = MealPlan::find($id);

            if (!$mealPlan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Meal plan not found',
                ], 404);
            }

            $mealPlan->delete();

            return response()->json([
                'success' => true,
                'message' => 'Meal plan deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting meal plan',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

