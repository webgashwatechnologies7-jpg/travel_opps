<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation Voucher - {{ $lead->query_id ?? $lead->id }}</title>
    <style>
        @page {
            margin: 20px;
            padding: 0px;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            background-color: #fff;
            color: #1a1a1a;
            margin: 0;
            padding: 0;
            line-height: 1.25;
            font-size: 8.5px;
        }

        /* UTILITIES */
        .w-100 { width: 100%; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .text-uppercase { text-transform: uppercase; }
        .m-0 { margin: 0; }
        .mb-1 { margin-bottom: 2px; }
        .p-1 { padding: 4px; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { border: 0.5px solid #ccc; padding: 4px; vertical-align: top; }
        .table th { background-color: #f3f4f6; color: #374151; font-weight: bold; text-align: left; }
        .section-title { background-color: #c6d9f1; border: 0.5px solid #ccc; padding: 3px 8px; font-weight: bold; font-size: 9px; color: #1e3a8a; margin-top: 8px; }

        /* HEADER */
        .main-header { border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 10px; }
        .company-name { font-size: 16px; color: #000; font-weight: bold; margin-bottom: 2px; }
        .company-addr { color: #4b5563; font-size: 8px; line-height: 1.1; }

        .voucher-header-title { font-size: 14px; margin: 5px 0; border-top: 1px dotted #888; border-bottom: 1px dotted #888; padding: 3px 0; font-weight: bold; }
        .voucher-routing { font-size: 10px; font-weight: bold; margin-bottom: 5px; font-style: italic; }

        /* BOXES */
        .info-box { border: 0.5px solid #ccc; background-color: #f9fafb; margin-bottom: 5px; }
        .voucher-meta-table { background-color: #d1d5db; width: 100%; border-collapse: collapse; }
        .voucher-meta-table td { border: 0.5px solid #9ca3af; padding: 4px; }

        /* ITINERARY */
        .day-header { border-bottom: 0.5px solid #ccc; padding: 2px 5px; font-weight: bold; font-size: 9px; display: block; margin-top: 5px; }
        .day-img { width: 80px; height: 60px; object-fit: cover; border-radius: 2px; margin-right: 8px; }
        .day-text { font-size: 8px; color: #333; line-height: 1.3; }

        /* FOOTER */
        .footer { margin-top: 20px; border-top: 0.5px solid #ccc; padding-top: 10px; }
        .authorized-sign { width: 100px; height: auto; margin-bottom: 5px; }
        
        .escalation-box { border: 0.5px dotted #999; padding: 5px; margin: 10px 0; font-size: 8px; }
        .cost-row { background-color: #fff; }
        .cost-total { background-color: #e5e7eb; font-weight: bold; }

        .includes-list, .excludes-list, .tc-list { padding-left: 15px; margin: 5px 0; }
        .includes-list li, .excludes-list li, .tc-list li { margin-bottom: 2px; }

    </style>
</head>

@php
    function imageToBase64($url)
    {
        try {
            if (empty($url)) return null;
            
            // Handle relative paths
            if (strpos($url, 'http') !== 0) {
                $url = config('app.url') . '/' . ltrim($url, '/');
            }

            $parsed = parse_url($url);
            $path = $parsed['path'] ?? '';
            if (!$path) return null;

            // SMART SEARCH: Try to find local file even if domain is different (e.g. live URL in local DB)
            $searchPaths = [];
            
            // 1. Exact path from URL
            $searchPaths[] = ltrim($path, '/');
            
            // 2. If it contains 'storage/', try to extract everything from 'storage/' onwards
            if (strpos($path, '/storage/') !== false) {
                $searchPaths[] = ltrim(strstr($path, '/storage/'), '/');
            } elseif (strpos($path, 'storage/') !== false) {
                $searchPaths[] = strstr($path, 'storage/');
            }

            foreach (array_unique($searchPaths) as $cleanPath) {
                // Check public directory
                $publicPath = public_path($cleanPath);
                if (file_exists($publicPath) && is_file($publicPath)) {
                    $type = pathinfo($publicPath, PATHINFO_EXTENSION);
                    $data = file_get_contents($publicPath);
                    return 'data:image/' . ($type ?: 'jpg') . ';base64,' . base64_encode($data);
                }

                // Check storage app public directory
                if (strpos($cleanPath, 'storage/') === 0) {
                    $innerPath = substr($cleanPath, 8);
                    $storagePath = storage_path('app/public/' . $innerPath);
                    if (file_exists($storagePath) && is_file($storagePath)) {
                        $type = pathinfo($storagePath, PATHINFO_EXTENSION);
                        $data = file_get_contents($storagePath);
                        return 'data:image/' . ($type ?: 'jpg') . ';base64,' . base64_encode($data);
                    }
                }
            }
            
            // 3. Fallback: Try fetching via HTTP
            $ctx = stream_context_create(['ssl' => ['verify_peer' => false, 'verify_peer_name' => false], 'http' => ['timeout' => 2]]);
            $data = @file_get_contents($url, false, $ctx);
            if ($data) {
                return 'data:image/jpg;base64,' . base64_encode($data);
            }
            
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    function numberToWords($number) {
        $formatter = new NumberFormatter("en", NumberFormatter::SPELLOUT);
        $words = $formatter->format($number);
        // Clean up formatting
        $words = str_replace('-', ' ', $words);
        return ucwords($words);
    }

    $company = $lead->company;
    $companyLogo = $company ? $company->logo : \App\Models\Setting::getValue('company_logo');
    $companyName = $company ? $company->name : \App\Models\Setting::getValue('company_name', 'TravelFusion CRM');
    $companyEmail = $company ? $company->email : \App\Models\Setting::getValue('company_email');
    $companyPhone = $company ? $company->phone : \App\Models\Setting::getValue('company_phone');
    $companyAddress = $company ? $company->address : \App\Models\Setting::getValue('company_address');
    $companyDomain = $company ? $company->getFullUrlAttribute() : config('app.url');
    $base64Logo = imageToBase64($companyLogo);

    $voucherNo = $invoice ? ($invoice->invoice_number ?: 'CTB' . str_pad($lead->id, 8, '0', STR_PAD_LEFT)) : ('VHR' . str_pad($lead->id, 6, '0', STR_PAD_LEFT));
    
    // Extracting Itinerary Routing
    $routing = $quotation && !empty($quotation->itinerary['routing']) ? $quotation->itinerary['routing'] : 'N/A';
    
    // Calculating Duration
    $nights = 0;
    $days = 0;
    if ($lead->travel_start_date && $lead->travel_end_date) {
        $diff = $lead->travel_start_date->diff($lead->travel_end_date);
        $nights = $diff->days;
        $days = $nights + 1;
    }

    // Accommodation extraction
    $hotels = [];
    if($quotation && isset($quotation->itinerary['day_events'])) {
        foreach($quotation->itinerary['day_events'] as $dayNum => $events) {
            foreach($events as $event) {
                if(($event['eventType']??'') === 'accommodation' && !empty($event['hotelOptions'])) {
                    $opt = $event['hotelOptions'][$confirmedOption - 1] ?? $event['hotelOptions'][0];
                    $dayIndex = (int)$dayNum - 1;
                    $city = $event['location'] ?? ($quotation->itinerary['days'][$dayIndex]['title'] ?? ($quotation->itinerary['days'][$dayIndex]['location'] ?? 'N/A'));
                    
                    $hotels[] = [
                        'day' => $dayNum,
                        'city' => $city,
                        'checkIn' => $opt['checkIn'] ?? '',
                        'checkOut' => $opt['checkOut'] ?? '',
                        'hotelName' => $opt['hotelName'] ?? '',
                        'roomCategory' => $opt['roomName'] ?? '',
                        'plan' => $opt['mealPlan'] ?? '',
                        'room' => $opt['roomCount'] ?? 1,
                        'nights' => 1
                    ];
                }
            }
        }
    }

    // Vehicle extraction
    $vehicles = [];
    if($quotation && !empty($quotation->itinerary['transportation'])) {
        $vehicles[] = [
            'name' => $quotation->itinerary['transportation']['vehicle'] ?? 'Private Cab',
            'date' => $lead->travel_start_date->format('d/m/y'),
            'tariff' => 'N/A',
            'km' => 'Sightseeing',
            'days' => $days,
            'driver' => 'Driver details will be shared 24hrs before travel'
        ];
    }

    // Pricing extraction
    $grandTotal = 0;
    $pricingRows = [];
    if($quotation && !empty($quotation->pricing_breakdown)) {
        $optionPricing = $quotation->pricing_breakdown[$confirmedOption] ?? reset($quotation->pricing_breakdown);
        $grandTotal = $optionPricing['final'] ?? ($optionPricing['total'] ?? $quotation->total_price);
        
        // If we have detailed breakdown, use it. Otherwise show package total.
        if(!empty($optionPricing['breakdown'])) {
             foreach($optionPricing['breakdown'] as $item) {
                 $pricingRows[] = [
                    'type' => $item['label'] ?? 'Tour Package',
                    'qty' => $item['count'] ?? 1,
                    'rate' => $item['price'] ?? 0,
                    'total' => $item['total'] ?? 0
                ];
             }
        }
    }

    if(empty($pricingRows) && $grandTotal > 0) {
        $pricingRows[] = [
            'type' => 'Full Tour Package',
            'qty' => 1,
            'rate' => $grandTotal,
            'total' => $grandTotal
        ];
    }

    $advanceReceived = ($lead->payments && count($lead->payments) > 0) ? $lead->payments->sum('paid_amount') : 0;
    $balanceAmount = $grandTotal - $advanceReceived;

    $accountDetailsJson = \App\Models\Setting::getValue('account_details');
    $accountDetails = $accountDetailsJson ? json_decode($accountDetailsJson, true) : null;
@endphp

<body>
    <div class="main-header">
        <table class="w-100">
            <tr>
                <td style="vertical-align: top;">
                    @if($base64Logo)
                        <img src="{{ $base64Logo }}" style="max-height: 70px; max-width: 150px;">
                    @else
                        <div style="font-weight: bold; font-size: 14px;">{{ $companyName }}</div>
                    @endif
                </td>
                <td class="text-right" style="vertical-align: top;">
                    <div class="company-name">{{ strtoupper($companyName) }}</div>
                    <div class="company-addr">
                        @if($companyAddress) {!! nl2br(e($companyAddress)) !!} @else Himachal Pradesh (State Code: 02), Country: India. @endif
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <div class="text-center">
        <div class="voucher-header-title">Tour Confirmation Voucher</div>
        <div class="voucher-routing">{{ $nights }} Night/s {{ $days }} Day/s ({{ $routing }})</div>
    </div>

    <table class="w-100" style="margin-bottom: 5px;">
        <tr>
            <td style="width: 55%; vertical-align: top; padding-right: 5px;">
                <div class="p-1 font-bold">From,</div>
                <div class="p-1">
                    <div class="font-bold">{{ $lead->client_name }}</div>
                    @if($lead->address) <div>{{ $lead->address }}</div> @endif
                    <div>State: {{ $lead->state ?? 'N/A' }}, Country: {{ $lead->country ?? 'India' }}</div>
                    <div>(M) {{ $lead->phone }}</div>
                </div>
            </td>
            <td style="width: 45%; vertical-align: top;">
                <table class="voucher-meta-table">
                    <tr>
                        <td class="font-bold">Voucher No. :</td>
                        <td class="font-bold">{{ $voucherNo }}</td>
                    </tr>
                    <tr>
                        <td>Date :</td>
                        <td>{{ date('d M Y') }}</td>
                    </tr>
                    <tr>
                        <td>Reference No. :</td>
                        <td>{{ $lead->query_id ?? 'PH-' . $lead->id }}</td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>

    <table class="table">
        <thead>
            <tr>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Night/s</th>
                <th>Day/s</th>
                <th>Adult/s</th>
                <th>Child</th>
                <th>Total Pax</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $lead->travel_start_date ? $lead->travel_start_date->format('d M Y') : 'TBA' }}</td>
                <td>{{ $lead->travel_end_date ? $lead->travel_end_date->format('d M Y') : 'TBA' }}</td>
                <td>{{ $nights }}</td>
                <td>{{ $days }}</td>
                <td>{{ $lead->adult }}</td>
                <td>{{ $lead->child }}</td>
                <td class="font-bold">{{ $lead->adult + $lead->child }}</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">Traveller Detail</div>
    <table class="table">
        <thead>
            <tr>
                <th style="width: 30%">Name</th>
                <th>Gender</th>
                <th>Birth Date</th>
                <th>Age</th>
                <th>Food</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $lead->client_name }}</td>
                <td>Male</td>
                <td>-</td>
                <td>-</td>
                <td>Veg</td>
                <td>Main Guest</td>
            </tr>
            @for($i=1; $i < ($lead->adult + $lead->child); $i++)
            <tr>
                <td>Guest {{ $i + 1 }}</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
            </tr>
            @endfor
        </tbody>
    </table>

    <div class="section-title">Itinerary</div>
    @if($quotation && isset($quotation->itinerary['days']))
        @foreach($quotation->itinerary['days'] as $index => $day)
            @php
                $dayId = $index + 1;
                $displayImage = $day['image'] ?? null;
                
                // If no day image, try to find an image in the events of this day
                if (!$displayImage && isset($quotation->itinerary['day_events'][$dayId])) {
                    foreach ($quotation->itinerary['day_events'][$dayId] as $event) {
                        if (!empty($event['image'])) {
                            $displayImage = $event['image'];
                            break;
                        }
                        // For accommodation, check hotelOptions image if exists
                        if (($event['eventType'] ?? '') === 'accommodation' && !empty($event['hotelOptions'])) {
                            $opt = $event['hotelOptions'][$confirmedOption - 1] ?? $event['hotelOptions'][0];
                            if (!empty($opt['image'])) {
                                $displayImage = $opt['image'];
                                break;
                            }
                        }
                    }
                }
                
                $dayTitle = $day['title'] ?? ($day['location'] ?? 'Tour Day');
            @endphp
            <div class="day-header text-uppercase">DAY {{ $dayId }} &nbsp;&nbsp;&nbsp; {{ $dayTitle }} &nbsp;&nbsp;&nbsp; {{ $lead->travel_start_date ? $lead->travel_start_date->copy()->addDays($index)->format('d-M-Y') : '' }}</div>
            <table class="w-100" style="margin-bottom: 5px; border: 0.5px solid #eee; padding: 5px;">
                <tr>
                    <td style="width: 90px; vertical-align: top;">
                        @if($displayImage)
                            @php $dayBase64 = imageToBase64($displayImage); @endphp
                            @if($dayBase64)
                                <img src="{{ $dayBase64 }}" class="day-img">
                            @endif
                        @else
                           <div style="width: 80px; height: 60px; background-color: #f3f4f6; border: 1px dashed #ccc; text-align: center; line-height: 60px; color: #999; font-size: 7px;">No Image</div>
                        @endif
                    </td>
                    <td>
                        <div class="day-text">
                            <strong>Meal Plan:</strong> {{ $day['meal_plan'] ?? 'As Per Itinerary' }} <br>
                            @if(!empty($day['distance'])) <strong>Distance:</strong> {{ $day['distance'] }} Kilometers <br> @endif
                            <strong>Tour Description:</strong> <br>
                            {{ $day['description'] ?? 'Sightseeing and travel as per the planned itinerary.' }}
                        </div>
                    </td>
                </tr>
            </table>
        @endforeach
    @endif

    <div class="section-title">Accommodation</div>
    <table class="table">
        <thead>
            <tr>
                <th>City</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Hotel</th>
                <th>Room Category</th>
                <th>Plan</th>
                <th>Room</th>
                <th>N/t</th>
            </tr>
        </thead>
        <tbody>
            @if(!empty($hotels))
                @foreach($hotels as $h)
                <tr>
                    <td>{{ $h['city'] }}</td>
                    <td>{{ !empty($h['checkIn']) ? date('d/m/y', strtotime($h['checkIn'])) : '-' }}</td>
                    <td>{{ !empty($h['checkOut']) ? date('d/m/y', strtotime($h['checkOut'])) : '-' }}</td>
                    <td class="font-bold">{{ $h['hotelName'] }}</td>
                    <td>{{ $h['roomCategory'] }}</td>
                    <td>{{ $h['plan'] }}</td>
                    <td>{{ $h['room'] }}</td>
                    <td>{{ $h['nights'] }}</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="8" class="text-center">Hotel details will be shared upon confirmation.</td>
                </tr>
            @endif
        </tbody>
    </table>

    <div class="section-title">Vehicle</div>
    <table class="table">
        <thead>
            <tr>
                <th>Vehicle</th>
                <th>On Date</th>
                <th>Tariff</th>
                <th>Km(s) Per Day</th>
                <th>Day/s</th>
                <th>Driver Detail</th>
            </tr>
        </thead>
        <tbody>
            @if(!empty($vehicles))
                @foreach($vehicles as $v)
                <tr>
                    <td class="font-bold">{{ $v['name'] }}</td>
                    <td>{{ $v['date'] }}</td>
                    <td>{{ $v['tariff'] }}</td>
                    <td>{{ $v['km'] }}</td>
                    <td>{{ $v['days'] }}</td>
                    <td>{{ $v['driver'] }}</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="6" class="text-center">Vehicle details available after final confirmation.</td>
                </tr>
            @endif
        </tbody>
    </table>

    <div class="section-title">Tour Cost</div>
    <table class="table">
        <thead>
            <tr>
                <th style="width: 40%">Net Rate</th>
                <th>Rate for</th>
                <th>Traveller</th>
                <th>Rate</th>
                <th>Currency</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($pricingRows as $p)
            <tr class="cost-row">
                <td>-</td>
                <td class="font-bold">{{ $p['type'] }}</td>
                <td>{{ $p['qty'] }}</td>
                <td>{{ number_format($p['rate'], 2) }}</td>
                <td>₹ (INR)</td>
                <td class="text-right font-bold">{{ number_format($p['total'], 2) }}</td>
            </tr>
            @endforeach
            <tr class="cost-total">
                <td colspan="5" class="text-right">Gross Total</td>
                <td class="text-right">{{ number_format($grandTotal, 2) }}</td>
            </tr>
            <tr class="cost-total">
                <td colspan="5" class="text-right">
                    <span style="float: left; font-weight: normal; font-style: italic;">{{ numberToWords($grandTotal) }} Rupees Only</span>
                    Tour Cost in ₹
                </td>
                <td class="text-right" style="font-size: 11px;">{{ number_format($grandTotal, 2) }}</td>
            </tr>
            @if($advanceReceived > 0)
            <tr>
                <td colspan="5" class="text-right">Advance Received</td>
                <td class="text-right">{{ number_format($advanceReceived, 2) }}</td>
            </tr>
            @endif
            <tr class="cost-total" style="background-color: #fef3c7;">
                <td colspan="5" class="text-right">Balance Amount</td>
                <td class="text-right" style="font-size: 11px; color: #b91c1c;">{{ number_format($balanceAmount, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="escalation-box">
        <table class="w-100">
            <tr>
                <td colspan="2" class="font-bold" style="border-bottom: 0.5px solid #ccc; padding-bottom: 2px; margin-bottom: 5px;">
                    For any assistance/help please follow the escalation matrix given below
                </td>
            </tr>
            <tr>
                <td style="width: 50%">
                    <strong>Cab Booking Contact:-</strong> <br>
                    93172-70072
                </td>
                <td>
                    <strong>Hotel Booking Contact:-</strong> <br>
                    93172-67062, 70180-58588
                </td>
            </tr>
            <tr>
                <td colspan="2" style="padding-top: 5px;">
                    <strong>Sales Executive Detail:-</strong> <br>
                    {{ $lead->creator ? $lead->creator->name : 'Manager' }} &nbsp; | &nbsp; 
                    {{ $lead->creator ? $lead->creator->phone : $companyPhone }} &nbsp; | &nbsp; 
                    {{ $lead->creator ? $lead->creator->email : $companyEmail }}
                </td>
            </tr>
        </table>
    </div>

    @if($quotation && !empty($quotation->itinerary['inclusions']))
    <div style="font-weight: bold; margin-top: 10px; border-bottom: 1px solid #ccc;">Includes</div>
    <ul class="includes-list">
        @foreach($quotation->itinerary['inclusions'] as $inc)
            <li>{{ $inc }}</li>
        @endforeach
    </ul>
    @endif

    @if($quotation && !empty($quotation->itinerary['exclusions']))
    <div style="font-weight: bold; margin-top: 5px; border-bottom: 1px solid #ccc;">Excludes</div>
    <ul class="excludes-list">
        @foreach($quotation->itinerary['exclusions'] as $exc)
            <li>{{ $exc }}</li>
        @endforeach
    </ul>
    @endif

    <div style="font-weight: bold; margin-top: 10px; border-bottom: 1px solid #ccc;">Terms and Condition</div>
    <ul class="tc-list">
        @if($quotation && !empty($quotation->itinerary['terms']))
            @foreach($quotation->itinerary['terms'] as $term)
                <li>{{ $term }}</li>
            @endforeach
        @else
            <li>Standard check-in time at the hotel is normally 1:00 pm and check-out is 11:00 am. An early check-in, or a late check-out is solely based on the discretion of the hotel.</li>
            <li>Transportation shall be provided as per the itinerary and will not be at disposal.</li>
            <li>AC will not be functional in hilly areas.</li>
            <li>Entrance fee, parking and guide charges are not included in the packages.</li>
            <li>Booking amount is subject to change in case of any changes in booked package.</li>
            <li>Airline seat and hotel is subject to availability at time of booking.</li>
            <li>Travelers furnishing incorrect age details may incur penalty at the time of travelling for airline and hotel booking in package.</li>
            <li>In case of unavailability in the listed hotels, arrangement for an alternate accommodation will be made in a hotel of similar category.</li>
            <li>The package price does not include expenditure expenses of personal nature.</li>
            <li>Meals Timings must be followed as per the instructed time of the hotels. For any un-availed meals we shall not be responsible.</li>
        @endif
    </ul>

    <table class="w-100" style="margin-top: 20px;">
        <tr>
            <td style="width: 50%; vertical-align: bottom;">
                <div style="border-top: 1px solid #000; display: inline-block; padding-top: 2px; width: 150px;">Customer's Signature</div>
                <div style="font-size: 7px; color: #666; margin-top: 2px;">(Prepared by: {{ $lead->creator ? $lead->creator->name : 'System' }})</div>
            </td>
            <td class="text-right" style="vertical-align: bottom;">
                <div class="font-bold">for {{ strtoupper($companyName) }}</div>
                @if($base64Logo)
                    <img src="{{ $base64Logo }}" class="authorized-sign" style="opacity: 0.6; filter: grayscale(100%);">
                @endif
                <div style="font-weight: bold; margin-top: 5px;">Authorized Signatory</div>
            </td>
        </tr>
    </table>

    <div class="text-center" style="font-size: 7px; color: #999; margin-top: 20px;">
        This is a Computer generated document and does not require any signature.
    </div>

</body>

</html>