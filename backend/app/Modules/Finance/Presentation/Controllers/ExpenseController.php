<?php

namespace App\Modules\Finance\Presentation\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Finance\Domain\Entities\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ExpenseController extends Controller
{
    /**
     * Create a new expense.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Validate the request
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'amount' => 'required|numeric|min:0',
                'category' => 'required|string|max:100',
                'paid_by' => 'required|exists:users,id',
                'expense_date' => 'required|date',
            ], [
                'title.required' => 'The title field is required.',
                'title.max' => 'The title may not be greater than 255 characters.',
                'amount.required' => 'The amount field is required.',
                'amount.numeric' => 'The amount must be a number.',
                'amount.min' => 'The amount must be at least 0.',
                'category.required' => 'The category field is required.',
                'category.max' => 'The category may not be greater than 100 characters.',
                'paid_by.required' => 'The paid_by field is required.',
                'paid_by.exists' => 'The selected user does not exist.',
                'expense_date.required' => 'The expense_date field is required.',
                'expense_date.date' => 'The expense_date must be a valid date.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $expense = Expense::create([
                'title' => $request->title,
                'amount' => (float) $request->amount,
                'category' => $request->category,
                'paid_by' => $request->paid_by,
                'expense_date' => $request->expense_date,
                'created_by' => $request->user()->id,
            ]);

            // Load relationships
            $expense->load(['paidByUser', 'creator']);

            return response()->json([
                'success' => true,
                'message' => 'Expense created successfully',
                'data' => [
                    'expense' => [
                        'id' => $expense->id,
                        'title' => $expense->title,
                        'amount' => $expense->amount,
                        'category' => $expense->category,
                        'paid_by' => $expense->paid_by,
                        'paid_by_user' => $expense->paidByUser ? [
                            'id' => $expense->paidByUser->id,
                            'name' => $expense->paidByUser->name,
                            'email' => $expense->paidByUser->email,
                        ] : null,
                        'expense_date' => $expense->expense_date,
                        'created_by' => $expense->created_by,
                        'creator' => $expense->creator ? [
                            'id' => $expense->creator->id,
                            'name' => $expense->creator->name,
                            'email' => $expense->creator->email,
                        ] : null,
                        'created_at' => $expense->created_at,
                        'updated_at' => $expense->updated_at,
                    ],
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating expense',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get all expenses.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $expenses = Expense::with(['paidByUser', 'creator'])
                ->orderBy('expense_date', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($expense) {
                    return [
                        'id' => $expense->id,
                        'title' => $expense->title,
                        'amount' => $expense->amount,
                        'category' => $expense->category,
                        'paid_by' => $expense->paid_by,
                        'paid_by_user' => $expense->paidByUser ? [
                            'id' => $expense->paidByUser->id,
                            'name' => $expense->paidByUser->name,
                            'email' => $expense->paidByUser->email,
                        ] : null,
                        'expense_date' => $expense->expense_date,
                        'created_by' => $expense->created_by,
                        'creator' => $expense->creator ? [
                            'id' => $expense->creator->id,
                            'name' => $expense->creator->name,
                            'email' => $expense->creator->email,
                        ] : null,
                        'created_at' => $expense->created_at,
                        'updated_at' => $expense->updated_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Expenses retrieved successfully',
                'data' => [
                    'expenses' => $expenses,
                    'count' => $expenses->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving expenses',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get monthly summary of expenses.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function monthlySummary(Request $request): JsonResponse
    {
        try {
            // Get current month and year if not provided
            $year = now()->year;
            $monthNum = now()->month;
            
            // Validate month format if provided
            if ($request->has('month')) {
                $month = $request->input('month');
                
                $validator = Validator::make($request->all(), [
                    'month' => 'regex:/^\d{4}-\d{2}$/',
                ], [
                    'month.regex' => 'The month must be in YYYY-MM format (e.g., 2025-12).',
                ]);

                if ($validator->fails()) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Validation failed',
                        'errors' => $validator->errors(),
                    ], 422);
                }

                $monthParts = explode('-', $month);
                $year = (int) $monthParts[0];
                $monthNum = (int) $monthParts[1];

                if ($monthNum < 1 || $monthNum > 12) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Invalid month. Month must be between 01 and 12.',
                    ], 422);
                }
            }

            // Get start and end dates for the month
            $startDate = \Carbon\Carbon::createFromDate($year, $monthNum, 1)->startOfMonth();
            $endDate = $startDate->copy()->endOfMonth();

            // Get expenses for the month
            $expenses = Expense::whereBetween('expense_date', [$startDate, $endDate])
                ->with(['paidByUser', 'creator'])
                ->get();

            // Calculate summary by category
            $categorySummary = $expenses->groupBy('category')
                ->map(function ($categoryExpenses, $category) {
                    return [
                        'category' => $category,
                        'count' => $categoryExpenses->count(),
                        'total_amount' => (float) $categoryExpenses->sum('amount'),
                    ];
                })
                ->values()
                ->sortByDesc('total_amount');

            // Calculate summary by user
            $userSummary = $expenses->groupBy('paid_by')
                ->map(function ($userExpenses, $userId) {
                    $user = $userExpenses->first()->paidByUser;
                    return [
                        'user_id' => (int) $userId,
                        'user_name' => $user ? $user->name : 'Unknown',
                        'user_email' => $user ? $user->email : null,
                        'count' => $userExpenses->count(),
                        'total_amount' => (float) $userExpenses->sum('amount'),
                    ];
                })
                ->values()
                ->sortByDesc('total_amount');

            // Calculate totals
            $totalAmount = (float) $expenses->sum('amount');
            $totalCount = $expenses->count();

            return response()->json([
                'success' => true,
                'message' => 'Monthly expense summary retrieved successfully',
                'data' => [
                    'month' => $startDate->format('Y-m'),
                    'summary' => [
                        'total_expenses' => $totalCount,
                        'total_amount' => $totalAmount,
                        'average_amount' => $totalCount > 0 ? round($totalAmount / $totalCount, 2) : 0,
                    ],
                    'by_category' => $categorySummary,
                    'by_user' => $userSummary,
                    'expenses' => $expenses->map(function ($expense) {
                        return [
                            'id' => $expense->id,
                            'title' => $expense->title,
                            'amount' => $expense->amount,
                            'category' => $expense->category,
                            'paid_by' => $expense->paid_by,
                            'paid_by_user' => $expense->paidByUser ? [
                                'id' => $expense->paidByUser->id,
                                'name' => $expense->paidByUser->name,
                                'email' => $expense->paidByUser->email,
                            ] : null,
                            'expense_date' => $expense->expense_date,
                            'created_at' => $expense->created_at,
                        ];
                    }),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving monthly summary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete an expense.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $expense = Expense::find($id);

            if (!$expense) {
                return response()->json([
                    'success' => false,
                    'message' => 'Expense not found',
                ], 404);
            }

            $expense->delete();

            return response()->json([
                'success' => true,
                'message' => 'Expense deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting expense',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}

