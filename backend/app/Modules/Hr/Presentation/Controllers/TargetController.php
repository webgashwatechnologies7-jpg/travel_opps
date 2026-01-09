<?php

namespace App\Modules\Hr\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Hr\Domain\Entities\EmployeeTarget;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TargetController extends Controller
{
    /**
     * Create or update employee target.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'user_id' => 'required|exists:users,id',
                'month' => 'required|string|regex:/^\d{4}-\d{2}$/',
                'target_amount' => 'required|numeric|min:0',
            ], [
                'user_id.required' => 'The user_id field is required.',
                'user_id.exists' => 'The selected user does not exist.',
                'month.required' => 'The month field is required.',
                'month.regex' => 'The month must be in YYYY-MM format (e.g., 2025-12).',
                'target_amount.required' => 'The target_amount field is required.',
                'target_amount.numeric' => 'The target_amount must be a number.',
                'target_amount.min' => 'The target_amount must be at least 0.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Create or update target (using updateOrCreate for unique constraint)
            $target = EmployeeTarget::updateOrCreate(
                [
                    'user_id' => $request->user_id,
                    'month' => $request->month,
                ],
                [
                    'target_amount' => $request->target_amount,
                    // Keep existing achieved_amount if updating, otherwise it defaults to 0
                ]
            );

            // If updating, preserve achieved_amount
            if ($target->wasRecentlyCreated === false) {
                // Target already existed, keep the achieved_amount
                $target->refresh();
            }

            // Load user relationship
            $target->load('user');

            return response()->json([
                'success' => true,
                'message' => $target->wasRecentlyCreated ? 'Target created successfully' : 'Target updated successfully',
                'data' => [
                    'target' => [
                        'id' => $target->id,
                        'user_id' => $target->user_id,
                        'user' => $target->user ? [
                            'id' => $target->user->id,
                            'name' => $target->user->name,
                            'email' => $target->user->email,
                        ] : null,
                        'month' => $target->month,
                        'target_amount' => $target->target_amount,
                        'achieved_amount' => $target->achieved_amount,
                        'created_at' => $target->created_at,
                        'updated_at' => $target->updated_at,
                    ],
                ],
            ], $target->wasRecentlyCreated ? 201 : 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating/updating target',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get target by user_id and month.
     *
     * @param int $userId
     * @param string $month
     * @return JsonResponse
     */
    public function show(int $userId, string $month): JsonResponse
    {
        try {
            // Validate month format
            if (!preg_match('/^\d{4}-\d{2}$/', $month)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid month format. Must be YYYY-MM (e.g., 2025-12)',
                ], 422);
            }

            $target = EmployeeTarget::with('user')
                ->where('user_id', $userId)
                ->where('month', $month)
                ->first();

            if (!$target) {
                return response()->json([
                    'success' => false,
                    'message' => 'Target not found for the specified user and month',
                ], 404);
            }

            // Calculate completion percentage
            $completionPercentage = $target->target_amount > 0
                ? round(($target->achieved_amount / $target->target_amount) * 100, 2)
                : 0;

            return response()->json([
                'success' => true,
                'message' => 'Target retrieved successfully',
                'data' => [
                    'target' => [
                        'id' => $target->id,
                        'user_id' => $target->user_id,
                        'user' => $target->user ? [
                            'id' => $target->user->id,
                            'name' => $target->user->name,
                            'email' => $target->user->email,
                            'phone' => $target->user->phone,
                        ] : null,
                        'month' => $target->month,
                        'target_amount' => $target->target_amount,
                        'achieved_amount' => $target->achieved_amount,
                        'completion_percentage' => $completionPercentage,
                        'created_at' => $target->created_at,
                        'updated_at' => $target->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving target',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update achieved amount for a target.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function updateAchieved(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'achieved_amount' => 'required|numeric|min:0',
            ], [
                'achieved_amount.required' => 'The achieved_amount field is required.',
                'achieved_amount.numeric' => 'The achieved_amount must be a number.',
                'achieved_amount.min' => 'The achieved_amount must be at least 0.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $target = EmployeeTarget::with('user')->find($id);

            if (!$target) {
                return response()->json([
                    'success' => false,
                    'message' => 'Target not found',
                ], 404);
            }

            // Update achieved amount
            $target->update([
                'achieved_amount' => $request->achieved_amount,
            ]);

            $target->refresh();

            // Calculate completion percentage
            $completionPercentage = $target->target_amount > 0
                ? round(($target->achieved_amount / $target->target_amount) * 100, 2)
                : 0;

            return response()->json([
                'success' => true,
                'message' => 'Achieved amount updated successfully',
                'data' => [
                    'target' => [
                        'id' => $target->id,
                        'user_id' => $target->user_id,
                        'user' => $target->user ? [
                            'id' => $target->user->id,
                            'name' => $target->user->name,
                            'email' => $target->user->email,
                        ] : null,
                        'month' => $target->month,
                        'target_amount' => $target->target_amount,
                        'achieved_amount' => $target->achieved_amount,
                        'completion_percentage' => $completionPercentage,
                        'updated_at' => $target->updated_at,
                    ],
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating achieved amount',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

