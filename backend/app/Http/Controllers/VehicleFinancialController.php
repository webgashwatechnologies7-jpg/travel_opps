<?php

namespace App\Http\Controllers;

use App\Models\Transfer;
use App\Models\LeadTransferCost;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Payments\Domain\Entities\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class VehicleFinancialController extends Controller
{
    /**
     * Get vehicle (transfer) financial summary (Part 3).
     * Profit, Loss - Weekly/Monthly/Yearly.
     */
    public function getVehicleFinancialSummary(Request $request, $transferId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'period' => 'required|in:weekly,monthly,yearly',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $period = $request->input('period');
            $vehicle = Transfer::findOrFail($transferId);

            $startDate = $request->input('start_date');
            $endDate = $request->input('end_date');

            if (!$startDate || !$endDate) {
                switch ($period) {
                    case 'weekly':
                        $startDate = now()->startOfWeek();
                        $endDate = now()->endOfWeek();
                        break;
                    case 'monthly':
                        $startDate = now()->startOfMonth();
                        $endDate = now()->endOfMonth();
                        break;
                    case 'yearly':
                        $startDate = now()->startOfYear();
                        $endDate = now()->endOfYear();
                        break;
                }
            }

            $startDate = Carbon::parse($startDate);
            $endDate = Carbon::parse($endDate);

            // Lead IDs that used this vehicle in period
            $leadIds = LeadTransferCost::where('transfer_id', $transferId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->pluck('lead_id')
                ->unique()
                ->values();

            // 1. COST - Total vehicle cost for leads in period
            $cost = (float) LeadTransferCost::where('transfer_id', $transferId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->sum('cost_amount');

            // 2. REVENUE - From revenue_amount in lead_transfer_costs OR payments from leads
            $revenueFromCosts = (float) LeadTransferCost::where('transfer_id', $transferId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->sum('revenue_amount');

            $revenueFromPayments = (float) Payment::whereIn('lead_id', $leadIds)
                ->whereHas('lead', fn ($q) => $q->where('status', 'confirmed'))
                ->sum('amount');

            // Use revenue_amount if set, else share of lead payments (full payment if single vehicle, else we use revenue_amount)
            $revenue = $revenueFromCosts > 0 ? $revenueFromCosts : $revenueFromPayments;

            // 3. PROFIT - Revenue - Cost
            $profit = round($revenue - $cost, 2);

            // 4. LOSS - Lost revenue from cancelled leads that used this vehicle
            $cancelledLeads = Lead::whereIn('id', $leadIds)
                ->where('status', 'cancelled')
                ->get();
            $loss = round($cancelledLeads->sum(fn ($lead) => $lead->getEstimatedValue()), 2);

            return response()->json([
                'success' => true,
                'data' => [
                    'vehicle' => [
                        'id' => $vehicle->id,
                        'name' => $vehicle->name,
                        'destination' => $vehicle->destination,
                        'status' => $vehicle->status,
                    ],
                    'period' => $period,
                    'date_range' => [
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d'),
                    ],
                    'financial_summary' => [
                        'revenue' => round($revenue, 2),
                        'cost' => round($cost, 2),
                        'profit' => $profit,
                        'loss' => $loss,
                        'net_profit' => round($profit - $loss, 2),
                    ],
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching vehicle financial summary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Add lead-vehicle cost (cost for this vehicle for a lead).
     */
    public function storeLeadVehicleCost(Request $request, $transferId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'lead_id' => 'required|exists:leads,id',
                'cost_amount' => 'required|numeric|min:0',
                'revenue_amount' => 'nullable|numeric|min:0',
                'transaction_date' => 'required|date',
                'description' => 'nullable|string|max:500',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            Transfer::findOrFail($transferId);

            $cost = LeadTransferCost::create([
                'company_id' => $request->user()->company_id,
                'lead_id' => $request->lead_id,
                'transfer_id' => $transferId,
                'cost_amount' => (float) $request->cost_amount,
                'revenue_amount' => (float) ($request->revenue_amount ?? 0),
                'transaction_date' => $request->transaction_date,
                'description' => $request->description,
                'created_by' => $request->user()->id,
            ]);

            $cost->load(['transfer', 'lead:id,client_name']);

            return response()->json([
                'success' => true,
                'message' => 'Lead vehicle cost added successfully',
                'data' => [
                    'cost' => [
                        'id' => $cost->id,
                        'lead_id' => $cost->lead_id,
                        'transfer_id' => $cost->transfer_id,
                        'cost_amount' => $cost->cost_amount,
                        'revenue_amount' => $cost->revenue_amount,
                        'transaction_date' => $cost->transaction_date->format('Y-m-d'),
                        'description' => $cost->description,
                    ],
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error adding lead vehicle cost',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get lead-vehicle costs for a vehicle.
     */
    public function getVehicleLeadCosts(Request $request, $transferId): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'period' => 'nullable|in:weekly,monthly,yearly',
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $query = LeadTransferCost::where('transfer_id', $transferId)
                ->with(['lead:id,client_name,status'])
                ->orderBy('transaction_date', 'desc');

            $startDate = $request->start_date;
            $endDate = $request->end_date;
            if (!$startDate && $request->filled('period')) {
                switch ($request->period) {
                    case 'weekly':
                        $startDate = now()->startOfWeek();
                        $endDate = now()->endOfWeek();
                        break;
                    case 'monthly':
                        $startDate = now()->startOfMonth();
                        $endDate = now()->endOfMonth();
                        break;
                    case 'yearly':
                        $startDate = now()->startOfYear();
                        $endDate = now()->endOfYear();
                        break;
                }
            }
            if ($startDate && $endDate) {
                $query->whereBetween('transaction_date', [$startDate, $endDate]);
            }

            $costs = $query->get()->map(fn ($c) => [
                'id' => $c->id,
                'lead_id' => $c->lead_id,
                'lead' => $c->lead ? ['id' => $c->lead->id, 'client_name' => $c->lead->client_name, 'status' => $c->lead->status] : null,
                'cost_amount' => (float) $c->cost_amount,
                'revenue_amount' => (float) $c->revenue_amount,
                'transaction_date' => $c->transaction_date->format('Y-m-d'),
                'description' => $c->description,
            ]);

            $vehicle = Transfer::find($transferId);

            return response()->json([
                'success' => true,
                'data' => [
                    'vehicle' => $vehicle ? ['id' => $vehicle->id, 'name' => $vehicle->name] : null,
                    'costs' => $costs,
                    'total_cost' => round($costs->sum(fn ($c) => $c['cost_amount']), 2),
                    'total_revenue' => round($costs->sum(fn ($c) => $c['revenue_amount']), 2),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching vehicle lead costs',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
