<?php

namespace App\Http\Controllers;

use App\Models\Destination;
use App\Traits\GenericCrudTrait;

class DestinationController extends Controller
{
    use GenericCrudTrait;

    protected function getModel()
    {
        return Destination::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ];
    }
}
