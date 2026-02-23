<?php

namespace App\Http\Controllers;

use App\Models\ExpenseType;
use App\Traits\GenericCrudTrait;

class ExpenseTypeController extends Controller
{
    use GenericCrudTrait;

    protected function getModel()
    {
        return ExpenseType::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ];
    }

    protected function formatResource($expenseType)
    {
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
    }
}
