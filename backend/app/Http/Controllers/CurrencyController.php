<?php

namespace App\Http\Controllers;

use App\Models\Currency;
use App\Traits\GenericCrudTrait;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Validator;

class CurrencyController extends Controller
{
    use GenericCrudTrait;

    protected function getModel()
    {
        return Currency::class;
    }

    protected function getValidationRules($id = null)
    {
        return [
            'name' => 'required|string|max:255',
            'symbol' => 'nullable|string|max:10',
            'rate' => 'required|numeric|min:0',
            'status' => 'nullable|in:active,inactive',
            'is_primary' => 'nullable|boolean',
        ];
    }

    protected function formatResource($currency)
    {
        return [
            'id' => $currency->id,
            'name' => $currency->name,
            'symbol' => $currency->symbol,
            'rate' => $currency->rate,
            'status' => $currency->status,
            'is_primary' => $currency->is_primary,
            'created_by' => $currency->created_by,
            'created_by_name' => $currency->creator ? $currency->creator->name : 'Travbizz Travel IT Solutions',
            'last_update' => $currency->updated_at ? $currency->updated_at->format('d-m-Y') : null,
            'updated_at' => $currency->updated_at,
            'created_at' => $currency->created_at,
        ];
    }

    /**
     * Fetch live exchange rate from external API.
     */
    public function fetchLiveRate(Request $request): JsonResponse
    {
        try {
            $from = strtoupper($request->query('from', 'USD'));
            $to = strtoupper($request->query('to', 'INR'));

            $response = Http::get("https://api.frankfurter.app/latest", [
                'from' => $from,
                'to' => $to,
            ]);

            if ($response->successful()) {
                $rate = $response->json()['rates'][$to] ?? null;
                if ($rate) {
                    return $this->successResponse(['rate' => $rate, 'base' => $from, 'target' => $to], 'Live rate fetched');
                }
            }

            return $this->errorResponse('Unable to fetch rate for the given currency.', 400);
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Error fetching live rate', $e);
        }
    }

    /**
     * Set the given currency as the primary currency.
     */
    public function setPrimary(int $id): JsonResponse
    {
        try {
            $currency = Currency::find($id);
            if (!$currency) {
                return $this->notFoundResponse('Currency not found');
            }

            Currency::where('is_primary', true)->update(['is_primary' => false]);
            $currency->update(['is_primary' => true, 'status' => 'active']);

            return $this->successResponse($this->formatResource($currency->fresh('creator')), "{$currency->name} set as primary currency");
        } catch (\Exception $e) {
            return $this->serverErrorResponse('Error setting primary currency', $e);
        }
    }
}
