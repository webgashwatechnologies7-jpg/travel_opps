<?php

namespace App\Http\Controllers;

use App\Modules\Leads\Domain\Entities\Lead;
use App\Models\Quotation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class QuotationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'lead_id' => 'nullable|integer|exists:leads,id',
                'status' => 'nullable|in:draft,sent,accepted,rejected,expired',
                'template' => 'nullable|string|max:50',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $companyId = $request->user()->company_id;

            $query = Quotation::with(['lead.company', 'lead:id,client_name,phone,email,company_id', 'creator:id,name,email'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->orderByDesc('updated_at')
                ->orderByDesc('created_at');

            if ($request->filled('lead_id')) {
                $query->where('lead_id', (int) $request->input('lead_id'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->input('status'));
            }

            if ($request->filled('template')) {
                $query->where('template', $request->input('template'));
            }

            $quotations = $query->get()->map(function (Quotation $q) {
                return $this->formatQuotation($q);
            });

            return response()->json([
                'success' => true,
                'message' => 'Quotations retrieved successfully',
                'data' => [
                    'quotations' => $quotations,
                    'total' => $quotations->count(),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quotations',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'lead_id' => 'required|integer|exists:leads,id',
                'title' => 'required|string|max:255',
                'description' => 'nullable|string',
                'travel_start_date' => 'required|date',
                'travel_end_date' => 'required|date|after_or_equal:travel_start_date',
                'adults' => 'required|integer|min:1',
                'children' => 'nullable|integer|min:0',
                'infants' => 'nullable|integer|min:0',
                'base_price' => 'required|numeric|min:0',
                'tax_amount' => 'nullable|numeric|min:0',
                'discount_amount' => 'nullable|numeric|min:0',
                'currency' => 'nullable|string|max:3',
                'valid_until' => 'nullable|date',
                'template' => 'nullable|in:default,premium,budget',
                'itinerary' => 'nullable|array',
                'inclusions' => 'nullable|array',
                'exclusions' => 'nullable|array',
                'pricing_breakdown' => 'nullable|array',
                'custom_fields' => 'nullable|array',
                'notes' => 'nullable|string',
                'terms_conditions' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $lead = Lead::find($request->input('lead_id'));

            if (!$lead || $lead->company_id !== $request->user()->company_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Lead not found',
                ], 404);
            }

            $basePrice = (float) $request->input('base_price');
            $taxAmount = (float) ($request->input('tax_amount') ?? 0);
            $discountAmount = (float) ($request->input('discount_amount') ?? 0);
            $totalPrice = $basePrice + $taxAmount - $discountAmount;

            $quotation = Quotation::create([
                'lead_id' => $lead->id,
                'created_by' => $request->user()->id,
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'travel_start_date' => $request->input('travel_start_date'),
                'travel_end_date' => $request->input('travel_end_date'),
                'adults' => (int) $request->input('adults'),
                'children' => (int) ($request->input('children') ?? 0),
                'infants' => (int) ($request->input('infants') ?? 0),
                'base_price' => $basePrice,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discountAmount,
                'total_price' => $totalPrice,
                'currency' => $request->input('currency', 'INR'),
                'valid_until' => $request->input('valid_until'),
                'template' => $request->input('template', 'default'),
                'itinerary' => $request->input('itinerary'),
                'inclusions' => $request->input('inclusions'),
                'exclusions' => $request->input('exclusions'),
                'pricing_breakdown' => $request->input('pricing_breakdown'),
                'custom_fields' => $request->input('custom_fields'),
                'notes' => $request->input('notes'),
                'terms_conditions' => $request->input('terms_conditions'),
            ]);

            $quotation->load(['lead.company', 'lead:id,client_name,phone,email,company_id', 'creator:id,name,email']);

            return response()->json([
                'success' => true,
                'message' => 'Quotation created successfully',
                'data' => [
                    'quotation' => $this->formatQuotation($quotation),
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create quotation',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id;

            $quotation = Quotation::with(['lead.company', 'lead:id,client_name,phone,email,company_id', 'creator:id,name,email'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->find($id);

            if (!$quotation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quotation not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Quotation retrieved successfully',
                'data' => [
                    'quotation' => $this->formatQuotation($quotation),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quotation',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'sometimes|required|string|max:255',
                'description' => 'nullable|string',
                'travel_start_date' => 'sometimes|required|date|after_or_equal:today',
                'travel_end_date' => 'sometimes|required|date|after_or_equal:travel_start_date',
                'adults' => 'sometimes|required|integer|min:1',
                'children' => 'nullable|integer|min:0',
                'infants' => 'nullable|integer|min:0',
                'base_price' => 'sometimes|required|numeric|min:0',
                'tax_amount' => 'nullable|numeric|min:0',
                'discount_amount' => 'nullable|numeric|min:0',
                'currency' => 'nullable|string|max:3',
                'valid_until' => 'nullable|date|after:today',
                'template' => 'nullable|in:default,premium,budget',
                'itinerary' => 'nullable|array',
                'inclusions' => 'nullable|array',
                'exclusions' => 'nullable|array',
                'pricing_breakdown' => 'nullable|array',
                'custom_fields' => 'nullable|array',
                'notes' => 'nullable|string',
                'terms_conditions' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $companyId = $request->user()->company_id;

            $quotation = Quotation::with(['lead:id,company_id'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->find($id);

            if (!$quotation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quotation not found',
                ], 404);
            }

            foreach (['title', 'description', 'travel_start_date', 'travel_end_date', 'adults', 'children', 'infants', 'base_price', 'tax_amount', 'discount_amount', 'currency', 'valid_until', 'template', 'itinerary', 'inclusions', 'exclusions', 'pricing_breakdown', 'custom_fields', 'notes', 'terms_conditions'] as $field) {
                if ($request->filled($field)) {
                    $quotation->{$field} = $request->input($field);
                }
            }

            if ($request->hasAny(['base_price', 'tax_amount', 'discount_amount'])) {
                $basePrice = (float) ($quotation->base_price);
                $taxAmount = (float) ($quotation->tax_amount ?? 0);
                $discountAmount = (float) ($quotation->discount_amount ?? 0);
                $quotation->total_price = $basePrice + $taxAmount - $discountAmount;
            }

            $quotation->save();
            $quotation->load(['lead.company', 'lead:id,client_name,phone,email,company_id', 'creator:id,name,email']);

            return response()->json([
                'success' => true,
                'message' => 'Quotation updated successfully',
                'data' => [
                    'quotation' => $this->formatQuotation($quotation),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update quotation',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $companyId = $request->user()->company_id;

            $quotation = Quotation::with(['lead:id,company_id'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->find($id);

            if (!$quotation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quotation not found',
                ], 404);
            }

            $quotation->delete();

            return response()->json([
                'success' => true,
                'message' => 'Quotation deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete quotation',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function send(Request $request, int $id): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'send_via' => 'required|in:email,whatsapp,both',
                'message' => 'nullable|string',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $companyId = $request->user()->company_id;

            $quotation = Quotation::with(['lead:id,client_name,email,phone,company_id'])
                ->whereHas('lead', function ($q) use ($companyId) {
                    $q->where('company_id', $companyId);
                })
                ->find($id);

            if (!$quotation) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quotation not found',
                ], 404);
            }

            $quotation->status = 'sent';
            $quotation->sent_at = now();
            $quotation->save();

            // TODO: Implement actual email/WhatsApp sending
            // For now, just log and return success

            return response()->json([
                'success' => true,
                'message' => 'Quotation sent successfully',
                'data' => [
                    'quotation' => $this->formatQuotation($quotation),
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to send quotation',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    public function preview(Request $request, int $id)
    {
        $companyId = $request->user()->company_id;

        $quotation = Quotation::with(['lead.company', 'lead:id,client_name,email,phone,company_id', 'creator:id,name,email'])
            ->whereHas('lead', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            })
            ->find($id);

        if (!$quotation) {
            return response()->json([
                'success' => false,
                'message' => 'Quotation not found',
            ], 404);
        }

        $html = $this->buildQuotationHtml($quotation);

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
        ]);
    }

    public function download(Request $request, int $id)
    {
        $companyId = $request->user()->company_id;

        $quotation = Quotation::with(['lead.company', 'lead:id,client_name,email,phone,company_id', 'creator:id,name,email'])
            ->whereHas('lead', function ($q) use ($companyId) {
                $q->where('company_id', $companyId);
            })
            ->find($id);

        if (!$quotation) {
            return response()->json([
                'success' => false,
                'message' => 'Quotation not found',
            ], 404);
        }

        $companyId = $quotation->lead->company_id;

        // Fetch all active master points for this company
        $masterPolicies = \App\Models\MasterPoint::where(function ($q) use ($companyId) {
            $q->where('company_id', $companyId)
                ->orWhereNull('company_id');
        })
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->groupBy('type');

        // Use DomPDF to generate PDF
        // Need to ensure Barryvdh\DomPDF\Facade\Pdf is imported or used as \Pdf
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.quotation', compact('quotation', 'masterPolicies'));

        // Enable remote images
        $pdf->setOption(['isRemoteEnabled' => true]);

        // Optional: Set paper size
        $pdf->setPaper('a4', 'portrait');

        $fileName = 'quotation-' . $quotation->quotation_number . '.pdf';

        // return $pdf->download($fileName);
        return $pdf->stream($fileName);
    }

    private function formatQuotation(Quotation $q): array
    {
        return [
            'id' => $q->id,
            'lead_id' => $q->lead_id,
            'quotation_number' => $q->quotation_number,
            'title' => $q->title,
            'description' => $q->description,
            'travel_start_date' => $q->travel_start_date ? $q->travel_start_date->format('Y-m-d') : null,
            'travel_end_date' => $q->travel_end_date ? $q->travel_end_date->format('Y-m-d') : null,
            'adults' => $q->adults,
            'children' => $q->children,
            'infants' => $q->infants,
            'duration_days' => $q->duration_days,
            'base_price' => $q->base_price,
            'tax_amount' => $q->tax_amount,
            'discount_amount' => $q->discount_amount,
            'total_price' => $q->total_price,
            'formatted_total_price' => $q->formatted_total_price,
            'currency' => $q->currency,
            'status' => $q->status,
            'valid_until' => $q->valid_until ? $q->valid_until->format('Y-m-d') : null,
            'is_expired' => $q->is_expired,
            'template' => $q->template,
            'itinerary' => $q->itinerary,
            'inclusions' => $q->inclusions,
            'exclusions' => $q->exclusions,
            'pricing_breakdown' => $q->pricing_breakdown,
            'custom_fields' => $q->custom_fields,
            'notes' => $q->notes,
            'terms_conditions' => $q->terms_conditions,
            'sent_at' => $q->sent_at,
            'accepted_at' => $q->accepted_at,
            'rejected_at' => $q->rejected_at,
            'created_at' => $q->created_at,
            'updated_at' => $q->updated_at,
            'lead' => $q->relationLoaded('lead') ? $q->lead : null,
            'creator' => $q->relationLoaded('creator') ? $q->creator : null,
        ];
    }

    public function publicPreview($id)
    {
        // Fetch quotation without scope for public preview (DEV ONLY)
        $quotation = Quotation::with(['lead.company', 'lead:id,client_name,email,phone,company_id', 'creator:id,name,email'])->find($id);

        if (!$quotation) {
            abort(404, 'Quotation not found');
        }

        return view('pdf.quotation', compact('quotation'));
    }

    private function buildQuotationHtml(Quotation $quotation): string
    {
        $companyId = $quotation->lead->company_id;

        // Fetch all active master points for this company
        $masterPolicies = \App\Models\MasterPoint::where(function ($q) use ($companyId) {
            $q->where('company_id', $companyId)
                ->orWhereNull('company_id');
        })
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->groupBy('type');

        return view('pdf.quotation', compact('quotation', 'masterPolicies'))->render();
    }
}
