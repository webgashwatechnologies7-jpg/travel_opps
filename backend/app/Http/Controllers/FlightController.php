<?php

namespace App\Http\Controllers;

use App\Models\Flight;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class FlightController extends Controller
{
    public function search(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'origin' => 'required|string|max:10',
                'destination' => 'required|string|max:10',
                'departure_date' => 'required|date|after_or_equal:today',
                'return_date' => 'nullable|date|after_or_equal:departure_date',
                'adults' => 'nullable|integer|min:1|max:9',
                'children' => 'nullable|integer|min:0|max:8',
                'infants' => 'nullable|integer|min:0|max:4',
                'class' => 'nullable|in:economy,business,first',
                'direct_only' => 'nullable|boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $origin = strtoupper($request->input('origin'));
            $destination = strtoupper($request->input('destination'));
            $departureDate = $request->input('departure_date');
            $returnDate = $request->input('return_date');
            $adults = (int) $request->input('adults', 1);
            $children = (int) $request->input('children', 0);
            $infants = (int) $request->input('infants', 0);
            $class = $request->input('class', 'economy');
            $directOnly = $request->boolean('direct_only', false);

            // Try external APIs first, then fallback to local DB, then mock
            $flights = $this->searchFlightsFromApis($origin, $destination, $departureDate, $returnDate, $adults, $children, $infants, $class, $directOnly);

            return response()->json([
                'success' => true,
                'message' => 'Flights retrieved successfully',
                'data' => [
                    'outbound' => $flights['outbound'] ?? [],
                    'return' => $flights['return'] ?? [],
                    'search_params' => [
                        'origin' => $origin,
                        'destination' => $destination,
                        'departure_date' => $departureDate,
                        'return_date' => $returnDate,
                        'adults' => $adults,
                        'children' => $children,
                        'infants' => $infants,
                        'class' => $class,
                        'direct_only' => $directOnly,
                    ],
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to search flights',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    private function searchFlightsFromApis(string $origin, string $destination, string $departureDate, ?string $returnDate, int $adults, int $children, int $infants, string $class, bool $directOnly): array
    {
        $rapidApiKey = env('RAPIDAPI_KEY');
        $amadeusKey = env('AMADEUS_API_KEY');
        $amadeusSecret = env('AMADEUS_API_SECRET');

        // Try RapidAPI Skyscanner
        if ($rapidApiKey) {
            try {
                $client = new \GuzzleHttp\Client();
                $response = $client->get('https://skyscanner-skyscanner-flight-search-v1.p.rapidapi.com/apiservices/browseroutes/v1.0/UK/GBP/en-US/' . $origin . '/' . $destination . '/' . $departureDate, [
                    'headers' => [
                        'X-RapidAPI-Key' => $rapidApiKey,
                        'X-RapidAPI-Host' => 'skyscanner-skyscanner-flight-search-v1.p.rapidapi.com',
                    ],
                    'timeout' => 15,
                ]);

                $data = json_decode($response->getBody(), true);
                if (!empty($data['Quotes'])) {
                    return $this->formatSkyscannerFlights($data, $class);
                }
            } catch (\Exception $e) {
                \Log::info('RapidAPI Skyscanner failed: ' . $e->getMessage());
            }
        }

        // Try Amadeus
        if ($amadeusKey && $amadeusSecret) {
            try {
                $token = $this->getAmadeusToken($amadeusKey, $amadeusSecret);
                if ($token) {
                    $client = new \GuzzleHttp\Client();
                    $response = $client->get('https://test.api.amadeus.com/v2/shopping/flight-offers', [
                        'query' => [
                            'originLocationCode' => $origin,
                            'destinationLocationCode' => $destination,
                            'departureDate' => $departureDate,
                            'returnDate' => $returnDate,
                            'adults' => $adults,
                            'children' => $children,
                            'infants' => $infants,
                            'travelClass' => strtoupper($class),
                            'nonStop' => $directOnly,
                            'max' => 20,
                        ],
                        'headers' => [
                            'Authorization' => 'Bearer ' . $token,
                        ],
                        'timeout' => 15,
                    ]);

                    $data = json_decode($response->getBody(), true);
                    if (!empty($data['data'])) {
                        return $this->formatAmadeusFlights($data, $class);
                    }
                }
            } catch (\Exception $e) {
                \Log::info('Amadeus API failed: ' . $e->getMessage());
            }
        }

        // Fallback to local DB
        $localFlights = Flight::where('origin_airport_code', $origin)
            ->where('destination_airport_code', $destination)
            ->whereDate('departure_time', $departureDate)
            ->when($directOnly, fn($q) => $q->where('is_direct', true))
            ->orderBy('departure_time')
            ->limit(20)
            ->get();

        if ($localFlights->isNotEmpty()) {
            return [
                'outbound' => $localFlights->map(fn($f) => $this->formatFlight($f, $class))->toArray(),
                'return' => [],
            ];
        }

        // Final fallback: mock flights
        return [
            'outbound' => $this->generateMockFlights($origin, $destination, $departureDate, $class, $directOnly),
            'return' => $returnDate ? $this->generateMockFlights($destination, $origin, $returnDate, $class, $directOnly) : [],
        ];
    }

    private function getAmadeusToken(string $key, string $secret): ?string
    {
        try {
            $client = new \GuzzleHttp\Client();
            $response = $client->post('https://test.api.amadeus.com/v1/security/oauth2/token', [
                'form_params' => [
                    'grant_type' => 'client_credentials',
                    'client_id' => $key,
                    'client_secret' => $secret,
                ],
                'headers' => [
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ],
                'timeout' => 10,
            ]);

            $data = json_decode($response->getBody(), true);
            return $data['access_token'] ?? null;
        } catch (\Exception $e) {
            \Log::info('Amadeus token fetch failed: ' . $e->getMessage());
            return null;
        }
    }

    private function formatSkyscannerFlights(array $data, string $class): array
    {
        $outbound = [];
        foreach ($data['Quotes'] as $quote) {
            $outbound[] = [
                'id' => 'sky-' . $quote['QuoteId'],
                'flight_code' => $data['Carriers'][$quote['OutboundLeg']['CarrierIds'][0]]['Name'] . ' ' . rand(100, 999),
                'airline_name' => $data['Carriers'][$quote['OutboundLeg']['CarrierIds'][0]]['Name'],
                'origin_airport_code' => $quote['OutboundLeg']['OriginId'],
                'destination_airport_code' => $quote['OutboundLeg']['DestinationId'],
                'departure_time' => $quote['OutboundLeg']['DepartureDate'],
                'arrival_time' => $quote['OutboundLeg']['ArrivalDate'],
                'duration' => $this->calculateDuration($quote['OutboundLeg']['DepartureDate'], $quote['OutboundLeg']['ArrivalDate']),
                'price' => $quote['MinPrice'],
                'currency' => $data['Currencies'][$quote['CurrencyId']]['Code'],
                'is_direct' => $quote['OutboundLeg']['StopCount'] === 0,
                'stops' => $quote['OutboundLeg']['StopCount'],
                'source_api' => 'skyscanner',
            ];
        }
        return ['outbound' => $outbound, 'return' => []];
    }

    private function formatAmadeusFlights(array $data, string $class): array
    {
        $outbound = [];
        foreach ($data['data'] as $offer) {
            $itinerary = $offer['itineraries'][0];
            $segment = $itinerary['segments'][0];
            $price = $offer['price'];

            $outbound[] = [
                'id' => 'amadeus-' . $offer['id'],
                'flight_code' => $segment['carrierCode'] . $segment['number'],
                'airline_name' => $segment['carrierCode'],
                'origin_airport_code' => $segment['departure']['iataCode'],
                'destination_airport_code' => $segment['arrival']['iataCode'],
                'departure_time' => $segment['departure']['at'],
                'arrival_time' => $segment['arrival']['at'],
                'duration' => $itinerary['duration'],
                'price' => $price['total'],
                'currency' => $price['currency'],
                'is_direct' => count($itinerary['segments']) === 1,
                'stops' => count($itinerary['segments']) - 1,
                'source_api' => 'amadeus',
            ];
        }
        return ['outbound' => $outbound, 'return' => []];
    }

    private function formatFlight(Flight $flight, string $class): array
    {
        $price = match ($class) {
            'business' => $flight->price_business,
            'first' => $flight->price_first,
            default => $flight->price_economy,
        };

        return [
            'id' => 'db-' . $flight->id,
            'flight_code' => $flight->flight_code,
            'airline_name' => $flight->airline_name,
            'origin_airport_code' => $flight->origin_airport_code,
            'destination_airport_code' => $flight->destination_airport_code,
            'origin_city' => $flight->origin_city,
            'destination_city' => $flight->destination_city,
            'departure_time' => $flight->formatted_departure,
            'arrival_time' => $flight->formatted_arrival,
            'duration' => $flight->duration,
            'price' => $price,
            'currency' => $flight->currency,
            'is_direct' => $flight->is_direct,
            'stops' => $flight->stops_count,
            'aircraft_type' => $flight->aircraft_type,
            'baggage_allowance' => $flight->baggage_allowance,
            'cancellation_policy' => $flight->cancellation_policy,
            'is_refundable' => $flight->is_refundable,
            'source_api' => 'database',
        ];
    }

    private function generateMockFlights(string $origin, string $destination, string $date, string $class, bool $directOnly): array
    {
        $airlines = ['IndiGo', 'Air India', 'SpiceJet', 'Vistara', 'GoAir', 'AirAsia'];
        $aircrafts = ['A320', 'B737', 'A321', 'B787', 'A330'];
        $flights = [];

        $count = $directOnly ? 3 : 6;
        for ($i = 0; $i < $count; $i++) {
            $departure = new \DateTime($date);
            $departure->setTime(rand(6, 22), rand(0, 59));
            $arrival = clone $departure;
            $arrival->add(new \DateInterval('PT' . rand(1, 5) . 'H' . rand(10, 55) . 'M'));

            $basePrice = rand(3000, 15000);
            $price = match ($class) {
                'business' => $basePrice * 3,
                'first' => $basePrice * 6,
                default => $basePrice,
            };

            $flights[] = [
                'id' => 'mock-' . $i,
                'flight_code' => $airlines[array_rand($airlines)][0] . rand(100, 999),
                'airline_name' => $airlines[array_rand($airlines)],
                'origin_airport_code' => $origin,
                'destination_airport_code' => $destination,
                'origin_city' => $origin,
                'destination_city' => $destination,
                'departure_time' => $departure->format('Y-m-d H:i'),
                'arrival_time' => $arrival->format('Y-m-d H:i'),
                'duration' => $arrival->diff($departure)->format('%h h %i m'),
                'price' => $price,
                'currency' => 'INR',
                'is_direct' => $i < 3 || $directOnly,
                'stops' => ($i < 3 || $directOnly) ? 0 : 1,
                'aircraft_type' => $aircrafts[array_rand($aircrafts)],
                'baggage_allowance' => '15 kg',
                'cancellation_policy' => rand(0, 1) ? 'Refundable' : 'Non-refundable',
                'is_refundable' => rand(0, 1),
                'source_api' => 'mock',
            ];
        }

        return $flights;
    }

    private function calculateDuration(string $departure, string $arrival): string
    {
        $dep = new \DateTime($departure);
        $arr = new \DateTime($arrival);
        $diff = $arr->diff($dep);
        return $diff->format('%h h %i m');
    }
}
