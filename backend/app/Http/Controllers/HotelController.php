<?php

namespace App\Http\Controllers;

use App\Models\Hotel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class HotelController extends Controller
{
    /**
     * Get all hotels.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $hotels = Hotel::with('creator')
                ->orderBy('updated_at', 'desc')
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($hotel) {
                    return [
                        'id' => $hotel->id,
                        'name' => $hotel->name,
                        'category' => $hotel->category,
                        'destination' => $hotel->destination,
                        'hotel_details' => $hotel->hotel_details,
                        'hotel_photo' => $hotel->hotel_photo ? asset('storage/' . $hotel->hotel_photo) : null,
                        'contact_person' => $hotel->contact_person,
                        'email' => $hotel->email,
                        'phone' => $hotel->phone,
                        'hotel_address' => $hotel->hotel_address,
                        'hotel_link' => $hotel->hotel_link,
                        'status' => $hotel->status,
                        'price_updates_count' => $hotel->price_updates_count,
                        'created_by' => $hotel->created_by,
                        'created_by_name' => $hotel->creator ? $hotel->creator->name : 'Travbizz Travel IT Solutions',
                        'last_update' => $hotel->updated_at ? $hotel->updated_at->format('d-m-Y') : null,
                        'updated_at' => $hotel->updated_at,
                        'created_at' => $hotel->created_at,
                    ];
                });

            return response()->json([
                'success' => true,
                'message' => 'Hotels retrieved successfully',
                'data' => $hotels,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving hotels',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new hotel.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Handle file upload
            $hotelPhotoPath = null;
            if ($request->hasFile('hotel_photo')) {
                $file = $request->file('hotel_photo');
                $hotelPhotoPath = $file->store('hotels', 'public');
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'category' => 'nullable|integer|min:1|max:5',
                'destination' => 'required|string|max:255',
                'hotel_details' => 'nullable|string',
                'hotel_photo' => 'nullable|image|max:2048',
                'contact_person' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'hotel_address' => 'required|string',
                'hotel_link' => 'nullable|url|max:255',
                'status' => 'nullable|in:active,inactive',
            ], [
                'name.required' => 'The hotel name field is required.',
                'destination.required' => 'The destination field is required.',
                'hotel_address.required' => 'The hotel address field is required.',
                'hotel_photo.image' => 'The hotel photo must be an image.',
                'hotel_photo.max' => 'The hotel photo must not be greater than 2MB.',
                'email.email' => 'The email must be a valid email address.',
                'hotel_link.url' => 'The hotel link must be a valid URL.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $hotel = Hotel::create([
                'name' => $request->name,
                'category' => $request->category,
                'destination' => $request->destination,
                'hotel_details' => $request->hotel_details,
                'hotel_photo' => $hotelPhotoPath,
                'contact_person' => $request->contact_person,
                'email' => $request->email,
                'phone' => $request->phone,
                'hotel_address' => $request->hotel_address,
                'hotel_link' => $request->hotel_link,
                'status' => $request->status ?? 'active',
                'price_updates_count' => 0,
                'created_by' => $request->user()->id,
            ]);

            $hotel->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Hotel created successfully',
                'data' => [
                    'id' => $hotel->id,
                    'name' => $hotel->name,
                    'category' => $hotel->category,
                    'destination' => $hotel->destination,
                    'hotel_details' => $hotel->hotel_details,
                    'hotel_photo' => $hotel->hotel_photo ? asset('storage/' . $hotel->hotel_photo) : null,
                    'contact_person' => $hotel->contact_person,
                    'email' => $hotel->email,
                    'phone' => $hotel->phone,
                    'hotel_address' => $hotel->hotel_address,
                    'hotel_link' => $hotel->hotel_link,
                    'status' => $hotel->status,
                    'price_updates_count' => $hotel->price_updates_count,
                    'created_by' => $hotel->created_by,
                    'created_by_name' => $hotel->creator ? $hotel->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $hotel->updated_at ? $hotel->updated_at->format('d-m-Y') : null,
                    'updated_at' => $hotel->updated_at,
                    'created_at' => $hotel->created_at,
                ],
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while creating hotel',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get a specific hotel.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function show(int $id): JsonResponse
    {
        try {
            $hotel = Hotel::with('creator')->find($id);

            if (!$hotel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hotel not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Hotel retrieved successfully',
                'data' => [
                    'id' => $hotel->id,
                    'name' => $hotel->name,
                    'category' => $hotel->category,
                    'destination' => $hotel->destination,
                    'hotel_details' => $hotel->hotel_details,
                    'hotel_photo' => $hotel->hotel_photo ? asset('storage/' . $hotel->hotel_photo) : null,
                    'contact_person' => $hotel->contact_person,
                    'email' => $hotel->email,
                    'phone' => $hotel->phone,
                    'hotel_address' => $hotel->hotel_address,
                    'hotel_link' => $hotel->hotel_link,
                    'status' => $hotel->status,
                    'price_updates_count' => $hotel->price_updates_count,
                    'created_by' => $hotel->created_by,
                    'created_by_name' => $hotel->creator ? $hotel->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $hotel->updated_at ? $hotel->updated_at->format('d-m-Y') : null,
                    'updated_at' => $hotel->updated_at,
                    'created_at' => $hotel->created_at,
                ],
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while retrieving hotel',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update a hotel.
     *
     * @param Request $request
     * @param int $id
     * @return JsonResponse
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $hotel = Hotel::find($id);

            if (!$hotel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hotel not found',
                ], 404);
            }

            // Handle file upload
            $hotelPhotoPath = $hotel->hotel_photo;
            if ($request->hasFile('hotel_photo')) {
                // Delete old photo if exists
                if ($hotel->hotel_photo && Storage::disk('public')->exists($hotel->hotel_photo)) {
                    Storage::disk('public')->delete($hotel->hotel_photo);
                }
                $file = $request->file('hotel_photo');
                $hotelPhotoPath = $file->store('hotels', 'public');
            }

            // Validate the request
            $validator = Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:255',
                'category' => 'sometimes|nullable|integer|min:1|max:5',
                'destination' => 'sometimes|required|string|max:255',
                'hotel_details' => 'nullable|string',
                'hotel_photo' => 'nullable|image|max:2048',
                'contact_person' => 'nullable|string|max:255',
                'email' => 'nullable|email|max:255',
                'phone' => 'nullable|string|max:20',
                'hotel_address' => 'sometimes|required|string',
                'hotel_link' => 'nullable|url|max:255',
                'status' => 'sometimes|in:active,inactive',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $updateData = [
                'name' => $request->has('name') ? $request->name : $hotel->name,
                'category' => $request->has('category') ? $request->category : $hotel->category,
                'destination' => $request->has('destination') ? $request->destination : $hotel->destination,
                'hotel_details' => $request->has('hotel_details') ? $request->hotel_details : $hotel->hotel_details,
                'hotel_photo' => $hotelPhotoPath,
                'contact_person' => $request->has('contact_person') ? $request->contact_person : $hotel->contact_person,
                'email' => $request->has('email') ? $request->email : $hotel->email,
                'phone' => $request->has('phone') ? $request->phone : $hotel->phone,
                'hotel_address' => $request->has('hotel_address') ? $request->hotel_address : $hotel->hotel_address,
                'hotel_link' => $request->has('hotel_link') ? $request->hotel_link : $hotel->hotel_link,
                'status' => $request->has('status') ? $request->status : $hotel->status,
            ];

            $hotel->update($updateData);
            $hotel->load('creator');

            return response()->json([
                'success' => true,
                'message' => 'Hotel updated successfully',
                'data' => [
                    'id' => $hotel->id,
                    'name' => $hotel->name,
                    'category' => $hotel->category,
                    'destination' => $hotel->destination,
                    'hotel_details' => $hotel->hotel_details,
                    'hotel_photo' => $hotel->hotel_photo ? asset('storage/' . $hotel->hotel_photo) : null,
                    'contact_person' => $hotel->contact_person,
                    'email' => $hotel->email,
                    'phone' => $hotel->phone,
                    'hotel_address' => $hotel->hotel_address,
                    'hotel_link' => $hotel->hotel_link,
                    'status' => $hotel->status,
                    'price_updates_count' => $hotel->price_updates_count,
                    'created_by' => $hotel->created_by,
                    'created_by_name' => $hotel->creator ? $hotel->creator->name : 'Travbizz Travel IT Solutions',
                    'last_update' => $hotel->updated_at ? $hotel->updated_at->format('d-m-Y') : null,
                    'updated_at' => $hotel->updated_at,
                    'created_at' => $hotel->created_at,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while updating hotel',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a hotel.
     *
     * @param int $id
     * @return JsonResponse
     */
    public function destroy(int $id): JsonResponse
    {
        try {
            $hotel = Hotel::find($id);

            if (!$hotel) {
                return response()->json([
                    'success' => false,
                    'message' => 'Hotel not found',
                ], 404);
            }

            $hotel->delete();

            return response()->json([
                'success' => true,
                'message' => 'Hotel deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while deleting hotel',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Import hotels from Excel file.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function import(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => 'required|mimes:xlsx,xls,csv|max:10240', // 10MB max
            ], [
                'file.required' => 'Please select a file to import.',
                'file.mimes' => 'The file must be a valid Excel file (xlsx, xls, csv).',
                'file.max' => 'The file size must not exceed 10MB.',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Handle file import (CSV/Excel)
            $importedCount = 0;
            $errors = [];
            
            if ($request->hasFile('import_file')) {
                $file = $request->file('import_file');
                $filePath = $file->getPathname();
                
                try {
                    // Handle CSV file
                    if ($file->getClientOriginalExtension() === 'csv') {
                        $handle = fopen($filePath, 'r');
                        $header = fgetcsv($handle); // Skip header row
                        
                        while (($row = fgetcsv($handle)) !== false) {
                            try {
                                Hotel::create([
                                    'name' => $row[0] ?? '',
                                    'category' => $row[1] ?? '',
                                    'destination' => $row[2] ?? '',
                                    'hotel_details' => $row[3] ?? '',
                                    'contact_person' => $row[4] ?? '',
                                    'email' => $row[5] ?? '',
                                    'phone' => $row[6] ?? '',
                                    'hotel_address' => $row[7] ?? '',
                                    'hotel_link' => $row[8] ?? '',
                                    'status' => $row[9] ?? 'active',
                                    'created_by' => $request->user()->id,
                                    'company_id' => tenant('id'),
                                ]);
                                $importedCount++;
                            } catch (\Exception $e) {
                                $errors[] = "Row " . ($importedCount + 2) . ": " . $e->getMessage();
                            }
                        }
                        fclose($handle);
                    }
                    // For Excel files, would need PhpSpreadsheet library
                    else {
                        return response()->json([
                            'success' => false,
                            'message' => 'Excel files require PhpSpreadsheet library. Please use CSV format or install PhpSpreadsheet.',
                        ], 422);
                    }
                } catch (\Exception $e) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Error processing file: ' . $e->getMessage(),
                    ], 500);
                }
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Hotels imported successfully',
                'data' => [
                    'imported_count' => $importedCount,
                    'errors' => $errors,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while importing hotels',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Export hotels to Excel.
     *
     * @return StreamedResponse
     */
    public function export(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="hotels_export_' . date('Y-m-d') . '.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8 to ensure Excel opens it correctly
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Add header row
            fputcsv($file, [
                'Hotel Name',
                'Category',
                'Destination',
                'From Date',
                'To Date',
                'Room Type',
                'Meal Plan',
                'Single',
                'Double',
                'Triple',
                'Quad',
                'Child Extra Bed',
                'Child No Bed',
                'Contact Person',
                'Email',
                'Phone',
                'Image Link'
            ]);
            
            // Get all hotels with their rates
            $hotels = Hotel::with('rates')->get();
            
            foreach ($hotels as $hotel) {
                if ($hotel->rates->count() > 0) {
                    // If hotel has rates, create a row for each rate
                    foreach ($hotel->rates as $rate) {
                        fputcsv($file, [
                            $hotel->name,
                            $hotel->category ? $hotel->category . ' Star' : '0 Star',
                            $hotel->destination,
                            $rate->from_date->format('d-m-Y'),
                            $rate->to_date->format('d-m-Y'),
                            $rate->room_type,
                            $rate->meal_plan,
                            $rate->single ?? 0,
                            $rate->double ?? 0,
                            $rate->triple ?? 0,
                            $rate->quad ?? 0,
                            $rate->cwb ?? 0,
                            $rate->cnb ?? 0,
                            $hotel->contact_person ?? '',
                            $hotel->email ?? '',
                            $hotel->phone ?? '',
                            $hotel->hotel_photo ? asset('storage/' . $hotel->hotel_photo) : ''
                        ]);
                    }
                } else {
                    // If hotel has no rates, create a single row with empty rate fields
                    fputcsv($file, [
                        $hotel->name,
                        $hotel->category ? $hotel->category . ' Star' : '0 Star',
                        $hotel->destination,
                        '01-01-1970',
                        '01-01-1970',
                        'Room type',
                        'Meal plan',
                        0,
                        0,
                        0,
                        0,
                        'Child Extra Bed',
                        'Child No Bed',
                        $hotel->contact_person ?? '',
                        $hotel->email ?? '',
                        $hotel->phone ?? '',
                        $hotel->hotel_photo ? asset('storage/' . $hotel->hotel_photo) : ''
                    ]);
                }
            }
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Download import template Excel file.
     *
     * @return StreamedResponse
     */
    public function downloadTemplate(): StreamedResponse
    {
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="hotel_import_template.csv"',
        ];

        $callback = function () {
            $file = fopen('php://output', 'w');
            
            // Add BOM for UTF-8 to ensure Excel opens it correctly
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Add header row
            fputcsv($file, [
                'Hotel Name',
                'Category',
                'Destination',
                'From Date',
                'To Date',
                'Room Type',
                'Meal Plan',
                'Single',
                'Double',
                'Triple',
                'Quad',
                'Child Extra Bed',
                'Child No Bed',
                'Contact Person',
                'Email',
                'Phone',
                'Image Link'
            ]);
            
            // Add example row
            fputcsv($file, [
                'Hotel name',
                '0 Star',
                'Destination',
                '01-01-1970',
                '01-01-1970',
                'Room type',
                'Meal plan',
                0,
                0,
                0,
                0,
                'Child Extra Bed',
                'Child No Bed',
                'Contact Person',
                'Email',
                'Phone',
                'Image Link'
            ]);
            
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Search hotels by location (using free APIs)
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $location = $request->input('location', '');
            $query = $request->input('query', '');

            if (!$location && !$query) {
                return response()->json([
                    'success' => false,
                    'message' => 'Location or query is required',
                ], 400);
            }

            $searchLocation = $location ?: $query;

            // Try multiple free APIs (location pe search = external API se hotels)
            $hotels = [];

            // Method 1: Try Amadeus (free tier - developers.amadeus.com, no credit card)
            $amadeusClientId = env('AMADEUS_CLIENT_ID');
            $amadeusClientSecret = env('AMADEUS_CLIENT_SECRET');
            if ($amadeusClientId && $amadeusClientSecret) {
                $amadeusHotels = $this->searchHotelsViaAmadeus($searchLocation, $amadeusClientId, $amadeusClientSecret);
                if (!empty($amadeusHotels)) {
                    $hotels = $amadeusHotels;
                }
            }

            // Method 2: Try RapidAPI Hotels4 (if API key available)
            $rapidApiKey = env('RAPIDAPI_KEY');
            if ($rapidApiKey) {
                try {
                    $client = new \GuzzleHttp\Client();
                    $response = $client->get('https://hotels4.p.rapidapi.com/locations/v2/search', [
                        'query' => [
                            'query' => $searchLocation,
                            'locale' => 'en_US',
                            'currency' => 'USD'
                        ],
                        'headers' => [
                            'X-RapidAPI-Key' => $rapidApiKey,
                            'X-RapidAPI-Host' => 'hotels4.p.rapidapi.com'
                        ],
                        'timeout' => 10
                    ]);

                    $data = json_decode($response->getBody(), true);
                    $hotelEntities = collect($data['suggestions'] ?? [])
                        ->firstWhere('group', 'HOTEL_GROUP')['entities'] ?? [];

                    if (count($hotelEntities) > 0) {
                        $hotels = collect($hotelEntities)->take(30)->map(function ($h) use ($searchLocation) {
                            return [
                                'id' => $h['destinationId'] ?? null,
                                'name' => $h['name'] ?? '',
                                'hotelName' => $h['name'] ?? '',
                                'rating' => $h['rating'] ?? rand(3, 5),
                                'address' => $h['caption'] ?? $searchLocation . ', India'
                            ];
                        })->toArray();
                    }
                } catch (\Exception $e) {
                    \Log::info('RapidAPI hotel search failed: ' . $e->getMessage());
                }
            }

            // Method 3: If no results, use local hotels database
            if (empty($hotels)) {
                $localHotels = Hotel::where('destination', 'like', '%' . $searchLocation . '%')
                    ->orWhere('name', 'like', '%' . $searchLocation . '%')
                    ->take(20)
                    ->get()
                    ->map(function ($hotel) {
                        return [
                            'id' => 'local-' . $hotel->id,
                            'name' => $hotel->name,
                            'hotelName' => $hotel->name,
                            'rating' => $hotel->category ?? 3,
                            'address' => $hotel->hotel_address ?? $hotel->destination ?? '',
                            'image' => $hotel->hotel_photo ? asset('storage/' . $hotel->hotel_photo) : null
                        ];
                    })
                    ->toArray();

                if (!empty($localHotels)) {
                    $hotels = $localHotels;
                }
            }

            // Method 4: Generate mock hotels as fallback
            if (empty($hotels)) {
                $hotelTypes = [
                    'Grand Hotel', 'Palace', 'Resort', 'Inn', 'Luxury Hotel',
                    'Boutique Hotel', 'Plaza', 'Suites', 'View Hotel', 'Heritage Hotel',
                    'International Hotel', 'Business Hotel', 'Beach Resort', 'Hill Resort',
                    'Spa Resort', 'Eco Resort', 'City Hotel', 'Airport Hotel', 'Budget Hotel',
                    'Premium Hotel', 'Executive Hotel', 'Royal Hotel', 'Crown Hotel', 'Tower Hotel'
                ];

                $hotels = collect($hotelTypes)->map(function ($type, $index) use ($searchLocation) {
                    return [
                        'id' => 'mock-' . $index,
                        'name' => $searchLocation . ' ' . $type,
                        'hotelName' => $searchLocation . ' ' . $type,
                        'rating' => rand(3, 5),
                        'address' => $searchLocation . ', India'
                    ];
                })->toArray();
            }

            return response()->json([
                'success' => true,
                'message' => 'Hotels retrieved successfully',
                'data' => $hotels,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while searching hotels',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get hotel rooms/rates from API
     *
     * @param Request $request
     * @param string $hotelId
     * @return JsonResponse
     */
    public function getRooms(Request $request, string $hotelId): JsonResponse
    {
        try {
            $checkIn = $request->input('checkIn', '');
            $checkOut = $request->input('checkOut', '');
            $adults = $request->input('adults', 2);
            $rooms = $request->input('rooms', 1);

            $rapidApiKey = env('RAPIDAPI_KEY');
            if (!$rapidApiKey) {
                // Return mock rooms if no API key
                return response()->json([
                    'success' => true,
                    'message' => 'Rooms retrieved successfully',
                    'data' => $this->generateMockRooms($hotelId, $adults),
                ], 200);
            }

            try {
                $client = new \GuzzleHttp\Client();
                
                // Step 1: Get hotel details first (if hotelId is from RapidAPI)
                if (!str_starts_with($hotelId, 'local-') && !str_starts_with($hotelId, 'mock-')) {
                    // Try to get hotel properties/search
                    $searchResponse = $client->get('https://hotels4.p.rapidapi.com/properties/v2/list', [
                        'json' => [
                            'currency' => 'USD',
                            'eapid' => 1,
                            'locale' => 'en_US',
                            'siteId' => 300000001,
                            'destination' => [
                                'regionId' => $hotelId
                            ],
                            'checkInDate' => [
                                'day' => $checkIn ? (int)date('d', strtotime($checkIn)) : (int)date('d'),
                                'month' => $checkIn ? (int)date('m', strtotime($checkIn)) : (int)date('m'),
                                'year' => $checkIn ? (int)date('Y', strtotime($checkIn)) : (int)date('Y')
                            ],
                            'checkOutDate' => [
                                'day' => $checkOut ? (int)date('d', strtotime($checkOut)) : (int)date('d', strtotime('+1 day')),
                                'month' => $checkOut ? (int)date('m', strtotime($checkOut)) : (int)date('m', strtotime('+1 day')),
                                'year' => $checkOut ? (int)date('Y', strtotime($checkOut)) : (int)date('Y', strtotime('+1 day'))
                            ],
                            'rooms' => [
                                [
                                    'adults' => (int)$adults,
                                    'children' => []
                                ]
                            ],
                            'resultsStartingIndex' => 0,
                            'resultsSize' => 1,
                            'sort' => 'PRICE_LOW_TO_HIGH'
                        ],
                        'headers' => [
                            'X-RapidAPI-Key' => $rapidApiKey,
                            'X-RapidAPI-Host' => 'hotels4.p.rapidapi.com',
                            'Content-Type' => 'application/json'
                        ],
                        'timeout' => 15
                    ]);

                    $searchData = json_decode($searchResponse->getBody(), true);
                    
                    if (isset($searchData['data']['propertySearch']['properties'])) {
                        $properties = $searchData['data']['propertySearch']['properties'];
                        
                        if (!empty($properties)) {
                            $property = $properties[0];
                            $propertyId = $property['id'] ?? null;
                            
                            if ($propertyId) {
                                // Step 2: Get property details with rooms
                                $propertyResponse = $client->get('https://hotels4.p.rapidapi.com/properties/v2/detail', [
                                    'json' => [
                                        'currency' => 'USD',
                                        'eapid' => 1,
                                        'locale' => 'en_US',
                                        'siteId' => 300000001,
                                        'propertyId' => $propertyId,
                                        'checkInDate' => [
                                            'day' => $checkIn ? (int)date('d', strtotime($checkIn)) : (int)date('d'),
                                            'month' => $checkIn ? (int)date('m', strtotime($checkIn)) : (int)date('m'),
                                            'year' => $checkIn ? (int)date('Y', strtotime($checkIn)) : (int)date('Y')
                                        ],
                                        'checkOutDate' => [
                                            'day' => $checkOut ? (int)date('d', strtotime($checkOut)) : (int)date('d', strtotime('+1 day')),
                                            'month' => $checkOut ? (int)date('m', strtotime($checkOut)) : (int)date('m', strtotime('+1 day')),
                                            'year' => $checkOut ? (int)date('Y', strtotime($checkOut)) : (int)date('Y', strtotime('+1 day'))
                                        ],
                                        'rooms' => [
                                            [
                                                'adults' => (int)$adults,
                                                'children' => []
                                            ]
                                        ]
                                    ],
                                    'headers' => [
                                        'X-RapidAPI-Key' => $rapidApiKey,
                                        'X-RapidAPI-Host' => 'hotels4.p.rapidapi.com',
                                        'Content-Type' => 'application/json'
                                    ],
                                    'timeout' => 15
                                ]);

                                $propertyData = json_decode($propertyResponse->getBody(), true);
                                
                                if (isset($propertyData['data']['propertyInfo']['propertyRoomTypes'])) {
                                    $roomTypes = $propertyData['data']['propertyInfo']['propertyRoomTypes'];
                                    
                                    $rooms = collect($roomTypes)->map(function ($roomType, $index) use ($adults, $checkIn, $checkOut) {
                                        $roomName = $roomType['roomTypeInfo']['name'] ?? 'Room';
                                        $bedTypes = collect($roomType['roomTypeInfo']['bedTypes'] ?? [])->pluck('name')->join(', ');
                                        $amenities = collect($roomType['roomTypeInfo']['amenities'] ?? [])->pluck('title')->take(3)->toArray();
                                        
                                        // Get pricing if available
                                        $price = null;
                                        if (isset($roomType['ratePlans']) && !empty($roomType['ratePlans'])) {
                                            $ratePlan = $roomType['ratePlans'][0];
                                            if (isset($ratePlan['price']['displayMessages'][0]['lineItems'][0]['price']['amount'])) {
                                                $price = $ratePlan['price']['displayMessages'][0]['lineItems'][0]['price']['amount'];
                                            }
                                        }
                                        
                                        return [
                                            'id' => $roomType['roomTypeId'] ?? "room-{$index}",
                                            'name' => $roomName . ($bedTypes ? " - {$bedTypes}" : ''),
                                            'guests' => (int)$adults,
                                            'mealPlan' => isset($roomType['ratePlans'][0]['ratePlanInfo']['name']) 
                                                ? $roomType['ratePlans'][0]['ratePlanInfo']['name'] 
                                                : 'Not Include',
                                            'price' => $price ? (int)($price * 83) : rand(20000, 50000), // Convert to INR (approx)
                                            'cancellation' => isset($roomType['ratePlans'][0]['cancellationInfo']['cancellationType']) 
                                                ? $roomType['ratePlans'][0]['cancellationInfo']['cancellationType'] 
                                                : 'Free cancellation',
                                            'amenities' => $amenities
                                        ];
                                    })->toArray();
                                    
                                    if (!empty($rooms)) {
                                        return response()->json([
                                            'success' => true,
                                            'message' => 'Rooms retrieved successfully',
                                            'data' => $rooms,
                                        ], 200);
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (\Exception $e) {
                \Log::info('RapidAPI rooms fetch failed: ' . $e->getMessage());
            }

            // Fallback to mock rooms
            return response()->json([
                'success' => true,
                'message' => 'Rooms retrieved successfully',
                'data' => $this->generateMockRooms($hotelId, $adults),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while fetching rooms',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Search hotels by location using Amadeus API (free tier - developers.amadeus.com)
     * Add AMADEUS_CLIENT_ID and AMADEUS_CLIENT_SECRET in .env
     *
     * @param string $searchLocation e.g. Shimla, Kufri, Delhi
     * @param string $clientId
     * @param string $clientSecret
     * @return array
     */
    private function searchHotelsViaAmadeus(string $searchLocation, string $clientId, string $clientSecret): array
    {
        $client = new \GuzzleHttp\Client(['timeout' => 12]);
        $baseUrl = 'https://test.api.amadeus.com/v1';

        try {
            // Step 1: Get OAuth token
            $tokenRes = $client->post("{$baseUrl}/security/oauth2/token", [
                'headers' => ['Content-Type' => 'application/x-www-form-urlencoded'],
                'form_params' => [
                    'grant_type' => 'client_credentials',
                    'client_id' => $clientId,
                    'client_secret' => $clientSecret,
                ],
            ]);
            $tokenData = json_decode($tokenRes->getBody(), true);
            $accessToken = $tokenData['access_token'] ?? null;
            if (!$accessToken) {
                return [];
            }

            // Step 2: Get city code from keyword (e.g. Shimla -> SLV or first match)
            $locRes = $client->get("{$baseUrl}/reference-data/locations", [
                'headers' => ['Authorization' => 'Bearer ' . $accessToken],
                'query' => [
                    'keyword' => $searchLocation,
                    'subType' => 'CITY',
                    'page[limit]' => 5,
                ],
            ]);
            $locData = json_decode($locRes->getBody(), true);
            $locations = $locData['data'] ?? [];
            $cityCode = null;
            foreach ($locations as $loc) {
                $code = $loc['iataCode'] ?? $loc['cityCode'] ?? null;
                if ($code && strlen($code) === 3) {
                    $cityCode = $code;
                    break;
                }
            }
            if (!$cityCode) {
                return [];
            }

            // Step 3: Get hotels by city code
            $hotelsRes = $client->get("{$baseUrl}/reference-data/locations/hotels/by-city", [
                'headers' => ['Authorization' => 'Bearer ' . $accessToken],
                'query' => ['cityCode' => $cityCode],
            ]);
            $hotelsData = json_decode($hotelsRes->getBody(), true);
            $list = $hotelsData['data'] ?? [];
            if (empty($list)) {
                return [];
            }

            return collect($list)->take(25)->map(function ($h) use ($searchLocation) {
                $name = $h['name'] ?? $h['hotelId'] ?? 'Hotel';
                $address = $searchLocation;
                if (!empty($h['address'])) {
                    $addr = $h['address'];
                    $parts = array_filter([$addr['lines'][0] ?? null, $addr['cityName'] ?? null, $addr['countryCode'] ?? null]);
                    $address = implode(', ', $parts);
                }
                return [
                    'id' => 'amadeus-' . ($h['hotelId'] ?? uniqid()),
                    'name' => $name,
                    'hotelName' => $name,
                    'rating' => (int) ($h['rating'] ?? 0) ?: 3,
                    'address' => $address,
                ];
            })->values()->toArray();
        } catch (\Exception $e) {
            \Log::info('Amadeus hotel search failed: ' . $e->getMessage());
            return [];
        }
    }

    /**
     * Generate mock rooms for testing
     *
     * @param string $hotelId
     * @param int $adults
     * @return array
     */
    private function generateMockRooms(string $hotelId, int $adults): array
    {
        return [
            [
                'id' => "room-{$hotelId}-1",
                'name' => 'Superior Villa - Free cancellation - 120 hours - Flexible',
                'guests' => $adults,
                'mealPlan' => 'Not Include',
                'price' => rand(20000, 50000),
                'cancellation' => 'Free cancellation - 120 hours',
                'amenities' => ['WiFi', 'Breakfast', 'Parking']
            ],
            [
                'id' => "room-{$hotelId}-2",
                'name' => 'Deluxe Room - Free cancellation - 48 hours',
                'guests' => $adults,
                'mealPlan' => 'Breakfast',
                'price' => rand(15000, 40000),
                'cancellation' => 'Free cancellation - 48 hours',
                'amenities' => ['WiFi', 'Breakfast']
            ],
            [
                'id' => "room-{$hotelId}-3",
                'name' => 'Standard Room - Non-refundable',
                'guests' => $adults,
                'mealPlan' => 'Not Include',
                'price' => rand(10000, 30000),
                'cancellation' => 'Non-refundable',
                'amenities' => ['WiFi']
            ]
        ];
    }
}
