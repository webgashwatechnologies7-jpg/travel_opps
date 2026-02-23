<?php

namespace App\Http\Controllers;

use App\Models\LeadSource;
use App\Traits\GenericCrudTrait;

class LeadSourceController extends Controller
{
    use GenericCrudTrait;

    protected function getModel()
    {
        return LeadSource::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'status' => 'nullable|in:active,inactive',
        ];
    }

    protected function formatResource($leadSource)
    {
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
    }
}
