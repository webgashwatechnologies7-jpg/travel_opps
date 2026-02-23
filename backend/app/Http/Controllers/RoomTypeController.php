<?php

namespace App\Http\Controllers;

use App\Models\RoomType;
use App\Traits\GenericCrudTrait;

class RoomTypeController extends Controller
{
    use GenericCrudTrait;

    protected function getModel()
    {
        return RoomType::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ];
    }

    protected function formatResource($roomType)
    {
        return [
            'id' => $roomType->id,
            'name' => $roomType->name,
            'status' => $roomType->status,
            'created_by' => $roomType->created_by,
            'created_by_name' => $roomType->creator ? $roomType->creator->name : 'Travbizz Travel IT Solutions',
            'last_update' => $roomType->updated_at ? $roomType->updated_at->format('d-m-Y') : null,
            'updated_at' => $roomType->updated_at,
            'created_at' => $roomType->created_at,
        ];
    }
}
