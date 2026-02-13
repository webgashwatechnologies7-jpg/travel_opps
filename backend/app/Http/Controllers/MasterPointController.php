<?php

namespace App\Http\Controllers;

use App\Models\MasterPoint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class MasterPointController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $companyId = $request->user()->company_id;
        $type = $request->query('type');

        $query = MasterPoint::where(function ($q) use ($companyId) {
            $q->where('company_id', $companyId)
                ->orWhereNull('company_id');
        });

        if ($type) {
            $query->where('type', $type);
        }

        return response()->json($query->orderBy('type')->orderBy('sort_order')->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'type' => 'required|string|in:inclusion,exclusion,terms,cancellation,confirmation,amendment,remark,remarks,payment,thank_you',
            'content' => 'required|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer'
        ]);

        $validated['company_id'] = $request->user()->company_id;

        $point = MasterPoint::create($validated);

        return response()->json($point, 201);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, int $id)
    {
        $point = MasterPoint::where('company_id', $request->user()->company_id)->findOrFail($id);

        $validated = $request->validate([
            'type' => 'sometimes|string|in:inclusion,exclusion,terms,cancellation,confirmation,amendment,remark,remarks,payment,thank_you',
            'content' => 'sometimes|string',
            'is_active' => 'boolean',
            'sort_order' => 'integer'
        ]);

        $point->update($validated);

        return response()->json($point);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, int $id)
    {
        $point = MasterPoint::where('company_id', $request->user()->company_id)->findOrFail($id);
        $point->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }

    /**
     * Get specific type points for frontend dropdowns
     */
    public function listByType(Request $request, string $type)
    {
        $companyId = $request->user()->company_id;

        $points = MasterPoint::where(function ($q) use ($companyId) {
            $q->where('company_id', $companyId)
                ->orWhereNull('company_id');
        })
            ->where('type', $type)
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->pluck('content');

        return response()->json($points);
    }
}
