<?php

namespace App\Http\Controllers;

use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class AccountsController extends Controller
{
    /**
     * Get all clients
     */
    public function clients(): JsonResponse
    {
        try {
            // Get leads that are individual clients (not corporate or agents)
            $clients = Lead::select([
                'id', 
                'client_name as name', 
                'email', 
                'phone as mobile', 
                'destination as city',
                'created_by',
                'created_at',
                'updated_at'
            ])
            ->where(function($query) {
                $query->where('client_type', 'individual')
                      ->orWhereNull('client_type');
            })
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($client) {
                return [
                    'id' => $client->id,
                    'name' => $client->name,
                    'mobile' => $client->mobile,
                    'email' => $client->email,
                    'queries' => 0, // Default to 0 for now
                    'lastQuery' => $client->updated_at ? $client->updated_at->format('Y-m-d') : 'N/A',
                    'city' => $client->city ?: 'N/A',
                    'createdBy' => 'Admin' // Default for now
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Clients retrieved successfully',
                'data' => $clients
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Clients API Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve clients',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get all agents
     */
    public function agents(): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;
            
            // Get users who are agents
            $agents = User::select([
                'id', 
                'name', 
                'email', 
                'phone as mobile',
                'company_name',
                'gst_number',
                'city',
                'created_by'
            ])
            ->where('company_id', $companyId)
            ->where(function($query) {
                $query->where('role', 'Agent')
                      ->orWhere('user_type', 'agent');
            })
            ->withCount(['leadsAssigned as queries'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($agent) {
                return [
                    'id' => $agent->id,
                    'company' => $agent->company_name ?: 'N/A',
                    'gst' => $agent->gst_number ?: 'N/A',
                    'name' => $agent->name,
                    'mobile' => $agent->mobile,
                    'email' => $agent->email,
                    'queries' => $agent->queries,
                    'lastQuery' => $agent->updated_at->format('Y-m-d'),
                    'city' => $agent->city ?: 'N/A',
                    'createdBy' => 'Admin'
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Agents retrieved successfully',
                'data' => $agents
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve agents',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get all corporate clients
     */
    public function corporate(): JsonResponse
    {
        try {
            $companyId = auth()->user()->company_id;
            
            // Get leads that are corporate clients
            $corporates = Lead::select([
                'id', 
                'client_name as companyName', 
                'email', 
                'phone as mobile', 
                'destination as city',
                'created_by',
                'budget',
                'client_title as industry',
                'created_at'
            ])
            ->where('company_id', $companyId)
            ->where('client_type', 'corporate')
            ->withCount(['queryProposals as queries'])
            ->with(['creator' => function($query) {
                $query->select('id', 'name');
            }])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function($corporate) {
                return [
                    'id' => $corporate->id,
                    'companyName' => $corporate->companyName,
                    'industry' => $corporate->industry ?: 'N/A',
                    'contactPerson' => $corporate->companyName,
                    'designation' => 'Contact Person',
                    'mobile' => $corporate->mobile,
                    'email' => $corporate->email,
                    'queries' => $corporate->queries,
                    'lastQuery' => $corporate->updated_at->format('Y-m-d'),
                    'city' => $corporate->city ?: 'N/A',
                    'creditLimit' => '₹' . number_format($corporate->budget ?: 0, 2),
                    'status' => 'Active'
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Corporate clients retrieved successfully',
                'data' => $corporates
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve corporate clients',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get cities for autocomplete
     */
    public function cities(Request $request): JsonResponse
    {
        try {
            $search = $request->get('search', '');
            
            // Mock cities data - replace with database if needed
            $allCities = [
                'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 
                'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Kanpur', 'Nagpur', 
                'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara',
                'Ghaziabad', 'Ludhiana', 'Agra', 'Nashik', 'Faridabad', 'Meerut',
                'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi', 'Srinagar',
                'Aurangabad', 'Dhanbad', 'Amritsar', 'Navi Mumbai', 'Allahabad',
                'Ranchi', 'Coimbatore', 'Jabalpur', 'Gwalior', 'Vijayawada',
                'Jodhpur', 'Madurai', 'Raipur', 'Kota', 'Chandigarh', 'Guwahati',
                'Goa', 'Surat', 'Bhubaneswar', 'Dehradun', 'Ranchi', 'Mysore',
                'Thiruvananthapuram', 'Coimbatore', 'Kochi', 'Kozhikode', 'Mangalore'
            ];

            $filteredCities = collect($allCities)
                ->filter(function($city) use ($search) {
                    return strcasecmp($city, $search) === 0 || 
                           stripos($city, $search) !== false;
                })
                ->take(10)
                ->values();

            return response()->json([
                'success' => true,
                'message' => 'Cities retrieved successfully',
                'data' => $filteredCities
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cities',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get single client by ID
     */
    public function getClient($id): JsonResponse
    {
        try {
            $client = Lead::find($id);
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            // Transform client data for frontend
            $clientData = [
                'id' => $client->id,
                'title' => $client->client_title ?: 'Mr.',
                'firstName' => explode(' ', $client->client_name)[0] ?? '',
                'lastName' => explode(' ', $client->client_name)[1] ?? '',
                'name' => $client->client_name,
                'email' => $client->email,
                'email2' => $client->email_secondary,
                'mobile' => $client->phone,
                'mobile2' => $client->phone_secondary,
                'city' => $client->destination ?: 'N/A',
                'address' => $client->address ?: 'N/A',
                'dateOfBirth' => $client->date_of_birth ? $client->date_of_birth->format('Y-m-d') : null,
                'marriageAnniversary' => $client->marriage_anniversary ? $client->marriage_anniversary->format('Y-m-d') : null,
                'status' => $client->status ?: 'Active',
                'createdBy' => 'Admin',
                'createdAt' => $client->created_at->format('Y-m-d'),
                'lastQuery' => $client->updated_at ? $client->updated_at->format('Y-m-d') : 'N/A',
                'totalQueries' => 0, // Default for now
                'totalPayments' => 0, // Default for now
                'totalAmount' => '₹0',
                'nextFollowUp' => 'N/A'
            ];

            return response()->json([
                'success' => true,
                'message' => 'Client retrieved successfully',
                'data' => $clientData
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve client',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Update client
     */
    public function updateClient(Request $request, $id): JsonResponse
    {
        try {
            $client = Lead::find($id);
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            $validator = Validator::make($request->all(), [
                'title' => 'nullable|string|max:10',
                'firstName' => 'required|string|max:255',
                'lastName' => 'required|string|max:255',
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'mobile' => 'required|string|max:20',
                'email2' => 'nullable|email|max:255',
                'mobile2' => 'nullable|string|max:20',
                'city' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:1000',
                'dateOfBirth' => 'nullable|date',
                'marriageAnniversary' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $client->update([
                'client_name' => $request->name,
                'client_title' => $request->title,
                'email' => $request->email,
                'phone' => $request->mobile,
                'email_secondary' => $request->email2,
                'phone_secondary' => $request->mobile2,
                'destination' => $request->city,
                'address' => $request->address,
                'date_of_birth' => $request->dateOfBirth,
                'marriage_anniversary' => $request->marriageAnniversary,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Client updated successfully',
                'data' => $client
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update client',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Delete client
     */
    public function deleteClient($id): JsonResponse
    {
        try {
            $client = Lead::find($id);
            if (!$client) {
                return response()->json([
                    'success' => false,
                    'message' => 'Client not found'
                ], 404);
            }

            $client->delete();

            return response()->json([
                'success' => true,
                'message' => 'Client deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete client',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Create new client
     */
    public function createClient(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'nullable|string|max:10',
                'firstName' => 'required|string|max:255',
                'lastName' => 'required|string|max:255',
                'name' => 'required|string|max:255',
                'email' => 'nullable|email|max:255',
                'mobile' => 'required|string|max:20',
                'email2' => 'nullable|email|max:255',
                'mobile2' => 'nullable|string|max:20',
                'city' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:1000',
                'dateOfBirth' => 'nullable|date',
                'marriageAnniversary' => 'nullable|date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $client = Lead::create([
                'client_name' => $request->name,
                'client_title' => $request->title,
                'email' => $request->email,
                'phone' => $request->mobile,
                'email_secondary' => $request->email2,
                'phone_secondary' => $request->mobile2,
                'source' => 'Website', // Default source
                'destination' => $request->city,
                'address' => $request->address,
                'date_of_birth' => $request->dateOfBirth,
                'marriage_anniversary' => $request->marriageAnniversary,
                'client_type' => 'individual',
                'status' => 'new',
                'created_by' => auth()->id(),
                'company_id' => auth()->user()->company_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Client created successfully',
                'data' => $client
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create client',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Create new agent
     */
    public function createAgent(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|max:255|unique:users,email',
                'mobile' => 'required|string|max:20',
                'company_name' => 'required|string|max:255',
                'gst_number' => 'nullable|string|max:255',
                'city' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $agent = User::create([
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->mobile,
                'company_name' => $request->company_name,
                'gst_number' => $request->gst_number,
                'city' => $request->city,
                'role' => 'Agent',
                'user_type' => 'agent',
                'company_id' => auth()->user()->company_id,
                'created_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Agent created successfully',
                'data' => $agent
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create agent',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Create new corporate client
     */
    public function createCorporate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'companyName' => 'required|string|max:255',
                'industry' => 'nullable|string|max:255',
                'contactPerson' => 'required|string|max:255',
                'designation' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'mobile' => 'required|string|max:20',
                'city' => 'nullable|string|max:255',
                'creditLimit' => 'nullable|numeric|min:0',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $corporate = Lead::create([
                'client_name' => $request->companyName,
                'client_title' => $request->industry,
                'email' => $request->email,
                'phone' => $request->mobile,
                'destination' => $request->city,
                'budget' => $request->creditLimit,
                'client_type' => 'corporate',
                'status' => 'new',
                'created_by' => auth()->id(),
                'company_id' => auth()->user()->company_id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Corporate client created successfully',
                'data' => $corporate
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create corporate client',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
