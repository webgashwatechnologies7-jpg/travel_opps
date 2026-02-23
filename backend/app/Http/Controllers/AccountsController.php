<?php

namespace App\Http\Controllers;

use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class AccountsController extends Controller
{
    /**
     * Get all clients (Individual)
     */
    public function clients(): JsonResponse
    {
        try {
            $clients = Lead::where(fn($q) => $q->where('client_type', 'individual')->orWhereNull('client_type'))
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($c) => $this->formatBasicAccount($c));

            return $this->successResponse($clients, 'Clients retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve clients', $e);
        }
    }

    /**
     * Get all agents
     */
    public function agents(): JsonResponse
    {
        try {
            $agents = User::where('company_id', auth()->user()->company_id)
                ->where(fn($q) => $q->where('role', 'Agent')->orWhere('user_type', 'agent'))
                ->withCount(['leadsAssigned as queries'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($a) => [
                    'id' => $a->id,
                    'company' => $a->company_name ?: 'N/A',
                    'gst' => $a->gst_number ?: 'N/A',
                    'name' => $a->name,
                    'mobile' => $a->phone,
                    'email' => $a->email,
                    'queries' => $a->queries,
                    'lastQuery' => $a->updated_at->format('Y-m-d'),
                    'city' => $a->city ?: 'N/A',
                    'createdBy' => 'Admin'
                ]);

            return $this->successResponse($agents, 'Agents retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve agents', $e);
        }
    }

    /**
     * Get all corporate clients
     */
    public function corporate(): JsonResponse
    {
        try {
            $corporates = Lead::where('company_id', auth()->user()->company_id)
                ->where('client_type', 'corporate')
                ->withCount(['queryProposals as queries'])
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($c) => [
                    'id' => $c->id,
                    'companyName' => $c->client_name,
                    'industry' => $c->client_title ?: 'N/A',
                    'contactPerson' => $c->contact_person ?: 'N/A',
                    'designation' => $c->designation ?: 'N/A',
                    'mobile' => $c->phone,
                    'email' => $c->email,
                    'queries' => $c->queries,
                    'lastQuery' => optional($c->updated_at)->format('Y-m-d') ?: 'N/A',
                    'city' => $c->destination ?: 'N/A',
                    'creditLimit' => '₹' . number_format($c->budget ?: 0, 2),
                    'status' => 'Active'
                ]);

            return $this->successResponse($corporates, 'Corporate clients retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve corporate clients', $e);
        }
    }

    /**
     * Get cities for autocomplete
     */
    public function cities(Request $request): JsonResponse
    {
        try {
            $search = strtolower($request->get('search', ''));
            $cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Lucknow', 'Nagpur', 'Goa', 'Surat'];

            $filtered = collect($cities)->filter(fn($c) => str_contains(strtolower($c), $search))->values();
            return $this->successResponse($filtered, 'Cities retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve cities', $e);
        }
    }

    /**
     * Get single client by ID
     */
    public function getClient($id): JsonResponse
    {
        try {
            $client = Lead::with(['queryProposals', 'payments', 'leadInvoices', 'queryDocuments', 'followups.user'])->find($id);
            if (!$client)
                return $this->notFoundResponse('Client not found');

            $clientData = array_merge($this->formatFullAccount($client), [
                'totalQueries' => $client->queryProposals->count() + 1,
                'totalPayments' => $client->payments->count(),
                'totalAmount' => '₹' . number_format($client->payments->sum('paid_amount'), 2),
                'payments' => $client->payments->map(fn($p) => $this->formatPayment($p)),
                'queries' => $this->formatQueries($client),
                'invoices' => $client->leadInvoices->map(fn($i) => $this->formatInvoice($i)),
                'documents' => $client->queryDocuments->map(fn($d) => $this->formatDocument($d)),
                'followUps' => $client->followups->map(fn($f) => $this->formatFollowup($f)),
            ]);

            return $this->successResponse($clientData, 'Client retrieved successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to retrieve client details', $e);
        }
    }

    /**
     * Account CRUD Operations
     */
    public function createClient(Request $request): JsonResponse
    {
        return $this->storeAccount($request, 'individual');
    }

    public function createCorporate(Request $request): JsonResponse
    {
        return $this->storeAccount($request, 'corporate');
    }

    public function updateClient(Request $request, $id): JsonResponse
    {
        try {
            $client = Lead::find($id);
            if (!$client)
                return $this->notFoundResponse('Client not found');

            $client->update([
                'client_name' => $request->name,
                'client_title' => $request->title,
                'email' => $request->email,
                'phone' => $request->mobile,
                'destination' => $request->city,
                'address' => $request->address,
                'date_of_birth' => $request->dateOfBirth,
                'marriage_anniversary' => $request->marriageAnniversary,
            ]);

            return $this->updatedResponse($client, 'Client updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to update client', $e);
        }
    }

    public function deleteClient($id): JsonResponse
    {
        return $this->destroyAccount($id);
    }

    public function updateCorporate(Request $request, $id): JsonResponse
    {
        try {
            $corp = Lead::find($id);
            if (!$corp || $corp->client_type !== 'corporate')
                return $this->notFoundResponse('Corporate client not found');
            $corp->update([
                'client_name' => $request->companyName,
                'contact_person' => $request->contactPerson,
                'phone' => $request->mobile,
                'email' => $request->email,
            ]);
            return $this->updatedResponse($corp, 'Corporate client updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to update corporate client', $e);
        }
    }

    public function deleteCorporate($id): JsonResponse
    {
        return $this->destroyAccount($id);
    }

    /**
     * Agent CRUD Operations
     */
    public function createAgent(Request $request): JsonResponse
    {
        try {
            $agent = User::create(array_merge($request->all(), [
                'password' => bcrypt('password123'),
                'user_type' => 'agent',
                'role' => 'Agent',
                'company_id' => auth()->user()->company_id,
                'created_by' => auth()->id(),
            ]));
            return $this->createdResponse($agent, 'Agent created successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create agent', $e);
        }
    }

    public function updateAgent(Request $request, $id): JsonResponse
    {
        try {
            $agent = User::find($id);
            if (!$agent || $agent->user_type !== 'agent')
                return $this->notFoundResponse('Agent not found');
            $agent->update($request->all());
            return $this->updatedResponse($agent, 'Agent updated successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to update agent', $e);
        }
    }

    public function deleteAgent($id): JsonResponse
    {
        try {
            $agent = User::find($id);
            if (!$agent || $agent->user_type !== 'agent')
                return $this->notFoundResponse('Agent not found');
            $agent->delete();
            return $this->deletedResponse('Agent deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to delete agent', $e);
        }
    }

    // ─── Internal Implementation Helpers ──────────────────────────────────────────

    private function storeAccount(Request $request, $type)
    {
        try {
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'mobile' => 'required|string|max:20',
                'email' => 'nullable|email|max:255',
            ]);
            if ($validator->fails())
                return $this->validationErrorResponse($validator);

            $data = $request->all();
            $data['client_name'] = $request->name ?? $request->companyName;
            $data['phone'] = $request->mobile;
            $data['client_type'] = $type;
            $data['created_by'] = auth()->id();
            $data['company_id'] = auth()->user()->company_id;

            $account = Lead::create($data);
            return $this->createdResponse($account, 'Account created successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to create account', $e);
        }
    }

    private function destroyAccount($id)
    {
        try {
            $account = Lead::find($id);
            if (!$account)
                return $this->notFoundResponse('Account not found');
            $account->delete();
            return $this->deletedResponse('Account deleted successfully');
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Failed to delete account', $e);
        }
    }

    private function formatBasicAccount($c)
    {
        return [
            'id' => $c->id,
            'name' => $c->client_name,
            'mobile' => $c->phone,
            'email' => $c->email,
            'queries' => 0,
            'lastQuery' => optional($c->updated_at)->format('Y-m-d') ?: 'N/A',
            'city' => $c->destination ?: 'N/A',
            'createdBy' => 'Admin'
        ];
    }

    private function formatFullAccount($c)
    {
        return [
            'id' => $c->id,
            'title' => $c->client_title ?: 'Mr.',
            'name' => $c->client_name,
            'firstName' => explode(' ', $c->client_name)[0] ?? '',
            'lastName' => explode(' ', $c->client_name)[1] ?? '',
            'email' => $c->email,
            'mobile' => $c->phone,
            'city' => $c->destination ?: 'N/A',
            'address' => $c->address ?: 'N/A',
            'dateOfBirth' => optional($c->date_of_birth)->format('Y-m-d'),
            'status' => $c->status ?: 'Active',
            'budget' => '₹' . number_format($c->budget ?? 0, 2),
        ];
    }

    private function formatPayment($p)
    {
        return [
            'id' => $p->id,
            'date' => optional($p->created_at)->format('Y-m-d') ?: 'N/A',
            'amount' => '₹' . number_format($p->amount ?? 0, 2),
            'paidAmount' => '₹' . number_format($p->paid_amount ?? 0, 2),
            'status' => ucfirst($p->status ?? 'pending')
        ];
    }

    private function formatInvoice($i)
    {
        return [
            'id' => $i->id,
            'invoiceNumber' => $i->invoice_number ?? 'N/A',
            'date' => optional($i->created_at)->format('Y-m-d') ?: 'N/A',
            'amount' => '₹' . number_format($i->total_amount ?? 0, 2),
            'status' => ucfirst($i->status ?? 'pending'),
        ];
    }

    private function formatDocument($d)
    {
        return [
            'id' => $d->id,
            'name' => $d->title ?: $d->file_name ?: 'Untitled',
            'uploadDate' => optional($d->created_at)->format('Y-m-d') ?: 'N/A',
        ];
    }

    private function formatFollowup($f)
    {
        return [
            'id' => $f->id,
            'date' => optional($f->reminder_date)->format('Y-m-d') ?: 'N/A',
            'type' => 'Follow-up',
            'notes' => $f->remark ?? '',
            'status' => $f->is_completed ? 'Completed' : 'Scheduled',
        ];
    }

    private function formatQueries($c)
    {
        $main = [
            [
                'id' => $c->id,
                'date' => optional($c->created_at)->format('Y-m-d') ?: 'N/A',
                'destination' => $c->destination ?? 'N/A',
                'status' => ucfirst($c->status ?? 'Active'),
            ]
        ];
        $extras = $c->queryProposals->map(fn($q) => [
            'id' => $q->id,
            'date' => optional($q->created_at)->format('Y-m-d') ?: 'N/A',
            'destination' => $q->destination ?? 'N/A',
            'status' => ucfirst($q->status ?? 'pending'),
        ])->toArray();
        return array_merge($main, $extras);
    }
}
