<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use App\Models\LeadHotelCost;
use App\Modules\Leads\Domain\Entities\Lead;
use App\Modules\Payments\Domain\Entities\Payment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class HotelFinancialController extends Controller
{
    /**
     * Get hotel financial summary (Part 4).
     * Profit, Loss - Weekly/Monthly/Yearly.
     */
    public function getHotelFinancialSummary(Request $request, $hotelId): JsonResponse
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
            $hotel = Hotel::findOrFail($hotelId);

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

            $leadIds = LeadHotelCost::where('hotel_id', $hotelId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->pluck('lead_id')
                ->unique()
                ->values();

            $cost = (float) LeadHotelCost::where('hotel_id', $hotelId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->sum('cost_amount');

            $revenueFromCosts = (float) LeadHotelCost::where('hotel_id', $hotelId)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->sum('revenue_amount');

            $revenueFromPayments = (float) Payment::whereIn('lead_id', $leadIds)
                ->whereHas('lead', fn ($q) => $q->where('status', 'confirmed'))
                ->sum('amount');

            $revenue = $revenueFromCosts > 0 ? $revenueFromCosts : $revenueFromPayments;
            $profit = round($revenue - $cost, 2);

            $cancelledLeads = Lead::whereIn('id', $leadIds)
                ->where('status', 'cancelled')
                ->get();
            $loss = round($cancelledLeads->sum(fn ($lead) => $lead->getEstimatedValue()), 2);

            return response()->json([
                'success' => true,
                'data' => [
                    'hotel' => [
                        'id' => $hotel->id,
                        'name' => $hotel->name,
                        'destination' => $hotel->destination,
                        'category' => $hotel->category,
                        'status' => $hotel->status,
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
                'message' => 'Error fetching hotel financial summary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function storeLeadHotelCost(Request $request, $hotelId): JsonResponse
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

            Hotel::findOrFail($hotelId);

            $cost = LeadHotelCost::create([
                'company_id' => $request->user()->company_id,
                'lead_id' => $request->lead_id,
                'hotel_id' => $hotelId,
                'cost_amount' => (float) $request->cost_amount,
                'revenue_amount' => (float) ($request->revenue_amount ?? 0),
                'transaction_date' => $request->transaction_date,
                'description' => $request->description,
                'created_by' => $request->user()->id,
            ]);

            $cost->load(['hotel', 'lead:id,client_name']);

            return response()->json([
                'success' => true,
                'message' => 'Lead hotel cost added successfully',
                'data' => [
                    'cost' => [
                        'id' => $cost->id,
                        'lead_id' => $cost->lead_id,
                        'hotel_id' => $cost->hotel_id,
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
                'message' => 'Error adding lead hotel cost',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    public function getHotelLeadCosts(Request $request, $hotelId): JsonResponse
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

            $query = LeadHotelCost::where('hotel_id', $hotelId)
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

            $hotel = Hotel::find($hotelId);

            return response()->json([
                'success' => true,
                'data' => [
                    'hotel' => $hotel ? ['id' => $hotel->id, 'name' => $hotel->name] : null,
                    'costs' => $costs,
                    'total_cost' => round($costs->sum(fn ($c) => $c['cost_amount']), 2),
                    'total_revenue' => round($costs->sum(fn ($c) => $c['revenue_amount']), 2),
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching hotel lead costs',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }
}
