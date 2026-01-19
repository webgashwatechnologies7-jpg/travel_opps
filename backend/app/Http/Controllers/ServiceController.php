<?php

namespace App\Http\Controllers;

use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ServiceController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $companyId = Auth::user()->company_id;
        $services = Service::where('company_id', $companyId)
            ->when($request->status, function ($query, $status) {
                return $query->where('status', $status);
            })
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $services
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            // Debug: Check if user is authenticated and has company_id
            if (!Auth::check()) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }

            $user = Auth::user();
            if (!$user->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'User does not have a company_id',
                    'debug' => [
                        'user_id' => $user->id,
                        'company_id' => $user->company_id
                    ]
                ], 400);
            }

            $request->validate([
                'name' => 'required|string|max:255|unique:services,name,NULL,id,company_id,' . $user->company_id,
                'description' => 'nullable|string|max:500',
                'status' => 'required|in:active,inactive'
            ]);

            $service = Service::create([
                'name' => $request->name,
                'description' => $request->description,
                'status' => $request->status,
                'company_id' => $user->company_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Service created successfully',
                'data' => $service
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create service: ' . $e->getMessage(),
                'debug' => [
                    'request_data' => $request->all(),
                    'user_id' => Auth::id(),
                    'company_id' => Auth::user()?->company_id
                ]
            ], 500);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $companyId = Auth::user()->company_id;
        $service = Service::where('company_id', $companyId)
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $service
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $request->validate([
            'name' => 'required|string|max:255|unique:services,name,' . $id . ',id,company_id,' . Auth::user()->company_id,
            'description' => 'nullable|string|max:500',
            'status' => 'required|in:active,inactive'
        ]);

        $companyId = Auth::user()->company_id;
        $service = Service::where('company_id', $companyId)
            ->findOrFail($id);

        $service->update([
            'name' => $request->name,
            'description' => $request->description,
            'status' => $request->status,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Service updated successfully',
            'data' => $service
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $companyId = Auth::user()->company_id;
        $service = Service::where('company_id', $companyId)
            ->findOrFail($id);

        $service->delete();

        return response()->json([
            'success' => true,
            'message' => 'Service deleted successfully'
        ]);
    }

    /**
     * Get active services for dropdown
     */
    public function getActiveServices()
    {
        $companyId = Auth::user()->company_id;
        $services = Service::where('company_id', $companyId)
            ->where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json([
            'success' => true,
            'data' => $services
        ]);
    }
}
