<?php

namespace App\Http\Controllers;

use App\Models\Lead;
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

            $query = Quotation::with(['lead:id,client_name,phone,email,company_id', 'creator:id,name,email'])
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
                'travel_start_date' => 'required|date|after_or_equal:today',
                'travel_end_date' => 'required|date|after_or_equal:travel_start_date',
                'adults' => 'required|integer|min:1',
                'children' => 'nullable|integer|min:0',
                'infants' => 'nullable|integer|min:0',
                'base_price' => 'required|numeric|min:0',
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

            $quotation->load(['lead:id,client_name,phone,email,company_id', 'creator:id,name,email']);

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

            $quotation = Quotation::with(['lead:id,client_name,phone,email,company_id', 'creator:id,name,email'])
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
            $quotation->load(['lead:id,client_name,phone,email,company_id', 'creator:id,name,email']);

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

    public function preview(Request $request, int $id): Response
    {
        $companyId = $request->user()->company_id;

        $quotation = Quotation::with(['lead:id,client_name,email,phone,company_id', 'creator:id,name,email'])
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

    public function download(Request $request, int $id): Response
    {
        $companyId = $request->user()->company_id;

        $quotation = Quotation::with(['lead:id,client_name,email,phone,company_id', 'creator:id,name,email'])
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

        $fileName = 'quotation-' . $quotation->quotation_number . '-' . now()->format('YmdHis') . '.html';
        $path = "quotations/{$companyId}/{$fileName}";

        Storage::disk('public')->put($path, $html);

        return response()->download(Storage::disk('public')->path($path), $fileName);
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

    private function buildQuotationHtml(Quotation $q): string
    {
        $clientName = htmlspecialchars((string) ($q->lead->client_name ?? 'Customer'), ENT_QUOTES, 'UTF-8');
        $title = htmlspecialchars((string) ($q->title ?? 'Travel Quotation'), ENT_QUOTES, 'UTF-8');
        $description = htmlspecialchars((string) ($q->description ?? ''), ENT_QUOTES, 'UTF-8');
        $quotationNumber = htmlspecialchars((string) $q->quotation_number, ENT_QUOTES, 'UTF-8');
        $validUntil = $q->valid_until ? $q->valid_until->format('d-m-Y') : '';
        $currency = htmlspecialchars((string) $q->currency, ENT_QUOTES, 'UTF-8');
        $totalPrice = number_format($q->total_price, 2);
        $template = htmlspecialchars((string) $q->template, ENT_QUOTES, 'UTF-8');
        $generatedAt = now()->format('d-m-Y H:i');

        $theme = match ($q->template) {
            'premium' => 'linear-gradient(135deg,#f59e0b,#f97316)',
            'budget' => 'linear-gradient(135deg,#10b981,#059669)',
            default => 'linear-gradient(135deg,#2563eb,#3b82f6)',
        };

        $itineraryHtml = '';
        if ($q->itinerary && is_array($q->itinerary)) {
            foreach ($q->itinerary as $day) {
                $dayTitle = htmlspecialchars((string) ($day['title'] ?? ''), ENT_QUOTES, 'UTF-8');
                $dayDesc = htmlspecialchars((string) ($day['description'] ?? ''), ENT_QUOTES, 'UTF-8');
                $itineraryHtml .= "
                <tr>
                    <td style='padding:12px;border-bottom:1px solid #e5e7eb;vertical-align:top'>
                        <strong>Day {$day['day'] ?? ''}</strong><br>
                        <span style='color:#6b7280'>{$dayTitle}</span>
                    </td>
                    <td style='padding:12px;border-bottom:1px solid #e5e7eb'>{$dayDesc}</td>
                </tr>";
            }
        }

        $inclusionsHtml = '';
        if ($q->inclusions && is_array($q->inclusions)) {
            foreach ($q->inclusions as $inc) {
                $inclusionsHtml .= '<li>' . htmlspecialchars((string) $inc, ENT_QUOTES, 'UTF-8') . '</li>';
            }
        }

        $exclusionsHtml = '';
        if ($q->exclusions && is_array($q->exclusions)) {
            foreach ($q->exclusions as $exc) {
                $exclusionsHtml .= '<li>' . htmlspecialchars((string) $exc, ENT_QUOTES, 'UTF-8') . '</li>';
            }
        }

        return "<!DOCTYPE html>
<html>
<head>
<meta charset='utf-8' />
<meta name='viewport' content='width=device-width, initial-scale=1' />
<title>Quotation {$quotationNumber}</title>
<style>
body{font-family:Arial, sans-serif; background:#f9fafb; padding:20px;}
.container{max-width:900px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; border-radius:12px; overflow:hidden;}
.header{background:{$theme}; color:#fff; padding:32px;}
.header h1{margin:0; font-size:26px;}
.header p{margin:8px 0 0 0; opacity:.9;}
.section{padding:24px 32px;}
.meta{display:flex; gap:24px; flex-wrap:wrap;}
.meta-item{flex:1; min-width:200px; background:#f9fafb; padding:16px; border-radius:8px;}
.meta-item h3{margin:0 0 8px 0; font-size:14px; color:#374151;}
.meta-item p{margin:0; font-size:16px; font-weight:600;}
.table{width:100%; border-collapse:collapse; margin:16px 0;}
.table th{background:#f3f4f6; padding:12px; text-align:left; font-weight:600;}
.table td{padding:12px; border-bottom:1px solid #e5e7eb;}
.price-summary{background:#f0f9ff; border:1px solid #0ea5e9; border-radius:8px; padding:16px; margin:16px 0;}
.price-row{display:flex; justify-content:space-between; margin:4px 0;}
.price-row.total{font-size:18px; font-weight:700; color:#1e40af; border-top:1px solid #0ea5e9; padding-top:8px; margin-top:8px;}
.footer{padding:20px 32px; background:#f9fafb; border-top:1px solid #e5e7eb; font-size:12px; color:#6b7280;}
</style>
</head>
<body>
<div class='container'>
  <div class='header'>
    <h1>Travel Quotation</h1>
    <p>Quotation #{$quotationNumber} | Valid until: {$validUntil} | Generated: {$generatedAt}</p>
  </div>
  <div class='section'>
    <h2>Client Details</h2>
    <div class='meta'>
      <div class='meta-item'>
        <h3>Client Name</h3>
        <p>{$clientName}</p>
      </div>
      <div class='meta-item'>
        <h3>Travel Dates</h3>
        <p>{$q->travel_start_date?->format('d-m-Y')} to {$q->travel_end_date?->format('d-m-Y')}</p>
      </div>
      <div class='meta-item'>
        <h3>Guests</h3>
        <p>{$q->adults} Adults" . ($q->children ? ", {$q->children} Children" : "") . ($q->infants ? ", {$q->infants} Infants" : "") . "</p>
      </div>
    </div>
    <h3 style='margin:24px 0 12px 0'>{$title}</h3>
    <p style='color:#6b7280;'>{$description}</p>
  </div>
  <div class='section'>
    <h2>Itinerary</h2>
    <table class='table'>
      <thead>
        <tr>
          <th style='width:30%'>Day</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {$itineraryHtml}
      </tbody>
    </table>
  </div>
  <div class='section'>
    <h2>Inclusions & Exclusions</h2>
    <div style='display:grid; grid-template-columns:1fr 1fr; gap:24px;'>
      <div>
        <h4>Inclusions</h4>
        <ul style='padding-left:20px; margin:8px 0;'>
          {$inclusionsHtml}
        </ul>
      </div>
      <div>
        <h4>Exclusions</h4>
        <ul style='padding-left:20px; margin:8px 0;'>
          {$exclusionsHtml}
        </ul>
      </div>
    </div>
  </div>
  <div class='section'>
    <h2>Price Summary</h2>
    <div class='price-summary'>
      <div class='price-row'><span>Base Price:</span><span>{$currency} {$q->base_price}</span></div>
      <div class='price-row'><span>Tax:</span><span>{$currency} {$q->tax_amount}</span></div>
      <div class='price-row'><span>Discount:</span><span>-{$currency} {$q->discount_amount}</span></div>
      <div class='price-row total'><span>Total Price:</span><span>{$currency} {$totalPrice}</span></div>
    </div>
  </div>
  <div class='footer'>
    <p>This quotation is valid until {$validUntil}. Subject to availability at the time of booking.</p>
    <p>Template: {$template} | Powered by TRAVELOPS CRM</p>
  </div>
</div>
</body>
</html>";
    }
}
