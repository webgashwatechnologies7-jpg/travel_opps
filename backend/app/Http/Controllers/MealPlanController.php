<?php

namespace App\Http\Controllers;

use App\Models\MealPlan;
use App\Traits\GenericCrudTrait;

class MealPlanController extends Controller
{
    use GenericCrudTrait;

    protected function getModel()
    {
        return MealPlan::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ];
    }

    protected function formatResource($mealPlan)
    {
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
    }
}
