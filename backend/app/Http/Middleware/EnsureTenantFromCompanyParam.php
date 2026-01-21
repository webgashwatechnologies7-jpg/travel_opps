<?php

namespace App\Http\Middleware;

use App\Models\Company;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantFromCompanyParam
{
    /**
     * Resolve tenant from route param and enforce active status.
     *
     * @param \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response) $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $companyId = $request->route('company_id');

        if (!$companyId) {
            Log::warning('WhatsApp webhook missing company_id route param', [
                'path' => $request->path(),
            ]);
            return response()->json(['success' => false, 'message' => 'Invalid company'], 200);
        }

        $company = Company::where('id', $companyId)
            ->where('status', 'active')
            ->first();

        if (!$company) {
            Log::warning('WhatsApp webhook invalid or inactive company', [
                'company_id' => $companyId,
                'path' => $request->path(),
            ]);
            return response()->json(['success' => false, 'message' => 'Invalid company'], 200);
        }

        app()->instance('tenant', $company);
        config(['tenant.id' => $company->id]);
        config(['tenant.company' => $company]);

        return $next($request);
    }
}
