<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\MenuController;
use App\Models\Company;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use App\Mail\SendUserCredentials;

class CompanyController extends Controller
{
    /**
     * Display a listing of companies.
     */
    public function index(Request $request)
    {
        $query = Company::with(['subscriptionPlan'])->withCount('users');

        // Search functionality
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('subdomain', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Sort
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $companies = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'success' => true,
            'data' => $companies
        ]);
    }

    /**
     * Store a newly created company.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'subdomain' => 'required|string|max:255|unique:companies,subdomain|regex:/^[a-z0-9-]+$/',
            'domain' => 'required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'subscription_plan_id' => 'required|exists:subscription_plans,id',
            'subscription_start_date' => 'nullable|date',
            'subscription_end_date' => 'nullable|date|after_or_equal:subscription_start_date',
            'notes' => 'nullable|string',
            'admin_name' => 'required|string|max:255',
            'admin_email' => 'required|email|unique:users,email',
            'admin_password' => 'required|string|min:8',
            'send_credentials_email' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $company = Company::create([
            'name' => $request->name,
            'subdomain' => strtolower($request->subdomain),
            'domain' => $request->domain,
            'email' => $request->email,
            'phone' => $request->phone,
            'address' => $request->address,
            'status' => 'active',
            'subscription_plan_id' => $request->subscription_plan_id,
            'subscription_start_date' => $request->subscription_start_date ?? now(),
            'subscription_end_date' => $request->subscription_end_date,
            'notes' => $request->notes,
        ]);

        // Create admin user for the company
        $admin = User::create([
            'name' => $request->admin_name,
            'email' => $request->admin_email,
            'password' => Hash::make($request->admin_password),
            'company_id' => $company->id,
            'is_active' => true,
        ]);

        // Assign Admin role to the user
        $admin->assignRole('Admin');

        // Create default company settings
        \App\Models\CompanySettings::create([
            'company_id' => $company->id,
            'sidebar_color' => '#2765B0',
            'dashboard_background_color' => '#D8DEF5',
            'header_background_color' => '#D8DEF5',
        ]);

        // Seed default sidebar menu for this company (includes WhatsApp & Email Integration under Settings)
        Setting::setValue(
            'company_' . $company->id . '_sidebar_menu',
            MenuController::getDefaultMenu(),
            'text',
            'Sidebar navigation menu (JSON)'
        );

        // Send credentials email if requested
        if ($request->boolean('send_credentials_email', true)) {
            try {
                Mail::to($request->admin_email)->send(
                    new SendUserCredentials(
                        $request->admin_email, 
                        $request->admin_password,
                        $company->name,
                        $company->crm_url
                    )
                );
            } catch (\Exception $e) {
                // Log error but don't fail the request
                \Log::error('Failed to send credentials email: ' . $e->getMessage());
            }
        }

        // Add CRM URL to response
        $companyData = $company->load(['users', 'subscriptionPlan'])->toArray();
        $companyData['crm_url'] = $company->crm_url;

        return response()->json([
            'success' => true,
            'message' => 'Company created successfully. Admin credentials sent via email.',
            'data' => $companyData
        ], 201);
    }

    /**
     * Display the specified company.
     */
    public function show($id)
    {
        $company = Company::with(['users', 'subscriptionPlan'])->findOrFail($id);
        $companyData = $company->toArray();
        $companyData['crm_url'] = $company->crm_url;
        $companyData['is_subscription_expired'] = $company->isSubscriptionExpired();
        $companyData['is_subscription_expiring_soon'] = $company->isSubscriptionExpiringSoon();

        return response()->json([
            'success' => true,
            'data' => $companyData
        ]);
    }

    /**
     * Update the specified company.
     */
    public function update(Request $request, $id)
    {
        $company = Company::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:255',
            'subdomain' => 'sometimes|required|string|max:255|unique:companies,subdomain,' . $id . '|regex:/^[a-z0-9-]+$/',
            'domain' => 'sometimes|required|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string',
            'status' => 'sometimes|required|in:active,inactive,suspended',
            'subscription_plan_id' => 'sometimes|required|exists:subscription_plans,id',
            'subscription_start_date' => 'nullable|date',
            'subscription_end_date' => 'nullable|date|after_or_equal:subscription_start_date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        $updateData = $request->only([
            'name', 'subdomain', 'domain', 'email', 'phone', 'address',
            'status', 'subscription_plan_id', 'subscription_start_date', 'subscription_end_date', 'notes'
        ]);

        if (isset($updateData['subdomain'])) {
            $updateData['subdomain'] = strtolower($updateData['subdomain']);
        }

        $company->update($updateData);

        return response()->json([
            'success' => true,
            'message' => 'Company updated successfully',
            'data' => $company->fresh()
        ]);
    }

    /**
     * Remove the specified company.
     */
    public function destroy($id)
    {
        $company = Company::findOrFail($id);
        
        // Soft delete the company
        $company->delete();

        return response()->json([
            'success' => true,
            'message' => 'Company deleted successfully'
        ]);
    }

    /**
     * Get company statistics.
     */
    public function stats()
    {
        $stats = [
            'total_companies' => Company::count(),
            'active_companies' => Company::where('status', 'active')->count(),
            'inactive_companies' => Company::where('status', 'inactive')->count(),
            'suspended_companies' => Company::where('status', 'suspended')->count(),
            'total_users' => User::whereNotNull('company_id')->count(),
            'expiring_soon' => Company::where('subscription_end_date', '<=', now()->addDays(7))
                ->where('subscription_end_date', '>=', now())
                ->where('status', 'active')
                ->count(),
            'expired_subscriptions' => Company::where('subscription_end_date', '<', now())
                ->where('status', 'active')
                ->count(),
            'recent_companies' => Company::with('subscriptionPlan')
                ->orderBy('created_at', 'desc')
                ->limit(5)
                ->get(),
        ];

        return response()->json([
            'success' => true,
            'data' => $stats
        ]);
    }
}

