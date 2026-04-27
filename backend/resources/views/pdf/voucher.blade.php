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
        .w-100 {
            width: 100%;
        }

        .text-center {
            text-align: center;
        }

        .text-right {
            text-align: right;
        }

        .font-bold {
            font-weight: bold;
        }

        .text-uppercase {
            text-transform: uppercase;
        }

        .m-0 {
            margin: 0;
        }

        .mb-1 {
            margin-bottom: 2px;
        }

        .p-1 {
            padding: 4px;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
        }

        .table th,
        .table td {
            border: 0.5px solid #ccc;
            padding: 4px;
            vertical-align: top;
        }

        .table th {
            background-color: #f3f4f6;
            color: #374151;
            font-weight: bold;
            text-align: left;
        }

        .section-title {
            background-color: #c6d9f1;
            border: 0.5px solid #ccc;
            padding: 3px 8px;
            font-weight: bold;
            font-size: 9px;
            color: #1e3a8a;
            margin-top: 8px;
        }

        /* HEADER */
        .main-header {
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            margin-bottom: 10px;
        }

        .company-name {
            font-size: 16px;
            color: #000;
            font-weight: bold;
            margin-bottom: 2px;
        }

        .company-addr {
            color: #4b5563;
            font-size: 8px;
            line-height: 1.1;
        }

        .voucher-header-title {
            font-size: 14px;
            margin: 5px 0;
            border-top: 1px dotted #888;
            border-bottom: 1px dotted #888;
            padding: 3px 0;
            font-weight: bold;
        }

        .voucher-routing {
            font-size: 10px;
            font-weight: bold;
            margin-bottom: 5px;
            font-style: italic;
        }

        /* BOXES */
        .info-box {
            border: 0.5px solid #ccc;
            background-color: #f9fafb;
            margin-bottom: 5px;
        }

        .voucher-meta-table {
            background-color: #d1d5db;
            width: 100%;
            border-collapse: collapse;
        }

        .voucher-meta-table td {
            border: 0.5px solid #9ca3af;
            padding: 4px;
        }

        /* ITINERARY */
        .day-header {
            border-bottom: 0.5px solid #ccc;
            padding: 2px 5px;
            font-weight: bold;
            font-size: 9px;
            display: block;
            margin-top: 5px;
        }

        .day-img {
            width: 80px;
            height: 60px;
            object-fit: cover;
            border-radius: 2px;
            margin-right: 8px;
        }

        .day-text {
            font-size: 8px;
            color: #333;
            line-height: 1.3;
        }

        /* FOOTER */
        .footer {
            margin-top: 20px;
            border-top: 0.5px solid #ccc;
            padding-top: 10px;
        }

        .authorized-sign {
            width: 100px;
            height: auto;
            margin-bottom: 5px;
        }

        .escalation-box {
            border: 0.5px dotted #999;
            padding: 5px;
            margin: 10px 0;
            font-size: 8px;
        }

        .cost-row {
            background-color: #fff;
        }

        .cost-total {
            background-color: #e5e7eb;
            font-weight: bold;
        }

        .includes-list,
        .excludes-list,
        .tc-list {
            padding-left: 15px;
            margin: 5px 0;
        }

        .includes-list li,
        .excludes-list li,
        .tc-list li {
            margin-bottom: 2px;
        }
    </style>
</head>

@php
    $company = $lead->company;
    $companyLogo = $company ? $company->logo : \App\Models\Setting::getValue('company_logo');
    $companyName = $company ? $company->name : \App\Models\Setting::getValue('company_name', 'TravelFusion CRM');
    $companyEmail = $company ? $company->email : \App\Models\Setting::getValue('company_email');
    $companyPhone = $company ? $company->phone : \App\Models\Setting::getValue('company_phone');
    $companyAddress = $company ? $company->address : \App\Models\Setting::getValue('company_address');
    $companyDomain = $company ? $company->getFullUrlAttribute() : config('app.url');
    // Robust image helper (copied from quotation.blade.php)
    if (!function_exists('imageToBase64')) {
        function imageToBase64($url)
        {
            try {
                if (empty($url)) return null;
                $parsed = parse_url($url);
                $relativePath = $parsed['path'] ?? '';
                if ($relativePath) {
                    $relativePath = ltrim($relativePath, '/');
                    $publicPath = public_path($relativePath);
                    if (file_exists($publicPath)) {
                        $type = pathinfo($publicPath, PATHINFO_EXTENSION);
                        $data = file_get_contents($publicPath);
                        return 'data:image/' . ($type ?: 'jpg') . ';base64,' . base64_encode($data);
                    }
                }
                // Fallback for external URLs
                $ctx = stream_context_create(['ssl' => ['verify_peer' => false], 'http' => ['timeout' => 5]]);
                $data = @file_get_contents($url, false, $ctx);
                if ($data) return 'data:image/jpg;base64,' . base64_encode($data);
                return null;
            } catch (\Exception $e) {
                return null;
            }
        }
    }

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
    if ($quotation && isset($quotation->itinerary['day_events'])) {
        foreach ($quotation->itinerary['day_events'] as $dayNum => $events) {
            foreach ($events as $event) {
                if (($event['eventType'] ?? '') === 'accommodation' && !empty($event['hotelOptions'])) {
                    $opt = $event['hotelOptions'][$confirmedOption - 1] ?? $event['hotelOptions'][0];
                    $dayIndex = (int) $dayNum - 1;
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
    if ($quotation && !empty($quotation->itinerary['transportation'])) {
        $vehicles[] = [
            'name' => $quotation->itinerary['transportation']['vehicle'] ?? 'Private Cab',
            'date' => $lead->travel_start_date ? $lead->travel_start_date->format('d/m/y') : 'TBA',
            'tariff' => 'N/A',
            'km' => 'Sightseeing',
            'days' => $days,
            'driver' => 'Driver details will be shared 24hrs before travel'
        ];
    }

    // Pricing extraction
    $grandTotal = 0;
    $pricingRows = [];
    if ($quotation && !empty($quotation->pricing_breakdown)) {
        $optionPricing = $quotation->pricing_breakdown[$confirmedOption] ?? reset($quotation->pricing_breakdown);
        $grandTotal = $optionPricing['final'] ?? ($optionPricing['total'] ?? $quotation->total_price);

        // If we have detailed breakdown, use it. Otherwise show package total.
        if (!empty($optionPricing['breakdown'])) {
            foreach ($optionPricing['breakdown'] as $item) {
                $pricingRows[] = [
                    'type' => $item['label'] ?? 'Tour Package',
                    'qty' => $item['count'] ?? 1,
                    'rate' => $item['price'] ?? 0,
                    'total' => $item['total'] ?? 0
                ];
            }
        }
    }

    if (empty($pricingRows) && $grandTotal > 0) {
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

    $cabContact = \App\Models\Setting::getValue('cab_booking_contact', '93172-70072');
    $hotelContact = \App\Models\Setting::getValue('hotel_booking_contact', '93172-67062, 70180-58588');
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
                        @if($companyAddress) {!! nl2br(e($companyAddress)) !!} @else Himachal Pradesh (State Code: 02),
                        Country: India. @endif
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
                    @if($lead->address)
                    <div>{{ $lead->address }}</div> @endif
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
            @if(!empty($lead->pax_details) && is_array($lead->pax_details))
                @foreach($lead->pax_details as $index => $pax)
                    @if(!empty($pax['name']))
                        <tr>
                            <td>{{ $pax['name'] }}</td>
                            <td>{{ $pax['gender'] ?? '-' }}</td>
                            <td>{{ !empty($pax['dob']) ? date('d/m/y', strtotime($pax['dob'])) : '-' }}</td>
                            <td>{{ $pax['age'] ?? '-' }}</td>
                            <td>{{ $pax['food'] ?? '-' }}</td>
                            <td>{{ $pax['notes'] ?? ($index === 0 ? 'Main Guest' : '-') }}</td>
                        </tr>
                    @endif
                @endforeach
            @else
                <tr>
                    <td>{{ $lead->client_name }}</td>
                    <td>Male</td>
                    <td>-</td>
                    <td>-</td>
                    <td>Veg</td>
                    <td>Main Guest</td>
                </tr>
            @endif
        </tbody>
    </table>

    <div class="section-title">Itinerary</div>
    @if($quotation && isset($quotation->itinerary['days']))
        @foreach($quotation->itinerary['days'] as $index => $day)
            @php
                $dayId = $index + 1;
                $displayImage = $day['image'] ?? null;

                if (!$displayImage && isset($quotation->itinerary['day_events'][$dayId])) {
                    foreach ($quotation->itinerary['day_events'][$dayId] as $event) {
                        if (!empty($event['image'])) {
                            $displayImage = $event['image'];
                            break;
                        }
                    }
                }

                $dayTitle = $day['title'] ?? ($day['destination'] ?? ($day['location'] ?? 'Tour Day'));

                // RESTORE: Calculate day date
                $dayDate = 'N/A';
                if (!empty($lead->travel_start_date)) {
                    try {
                        $startDate = \Carbon\Carbon::parse($lead->travel_start_date);
                        $dayDate = $startDate->addDays($index)->format('d M Y');
                    } catch (\Exception $e) {
                        $dayDate = 'N/A';
                    }
                }

                // RESTORE: Extract specific meal plan
                $dayMealPlan = $day['meal_plan'] ?? null;
                if (empty($dayMealPlan) || $dayMealPlan === 'As Per Itinerary') {
                    if (isset($quotation->itinerary['day_events'][$dayId])) {
                        // First pass: look for explicit meal events
                        foreach ($quotation->itinerary['day_events'][$dayId] as $e) {
                            if (isset($e['eventType']) && strtolower($e['eventType']) === 'meal') {
                                $dayMealPlan = $e['subject'] ?? ($e['mealType'] ?? $e['mealPlan']);
                                break;
                            }
                        }
                        
                        // Second pass: fallback to any event with meal info if no explicit meal event found
                        if (empty($dayMealPlan)) {
                            foreach ($quotation->itinerary['day_events'][$dayId] as $e) {
                                if (!empty($e['mealType']) || !empty($e['mealPlan'])) {
                                    // But don't use subject here as it might be 'TEST' or something else
                                    $dayMealPlan = $e['mealType'] ?? $e['mealPlan'];
                                    break;
                                }
                            }
                        }
                    }
                }
                if (empty($dayMealPlan))
                    $dayMealPlan = 'As Per Itinerary';

                // 1. NAME & DESCRIPTION: Find the best candidate event
                $mainItineraryEvent = null;
                $allEvents = $quotation->itinerary['day_events'][$dayId] ?? [];

                // Priority 1: 'day-itinerary' type
                foreach ($allEvents as $e) {
                    if (($e['eventType'] ?? '') === 'day-itinerary') {
                        $mainItineraryEvent = $e;
                        break;
                    }
                }

                // Priority 2: First event that isn't transport or hotel
                if (!$mainItineraryEvent) {
                    foreach ($allEvents as $e) {
                        $type = strtolower($e['eventType'] ?? '');
                        if (!in_array($type, ['transportation', 'transport', 'accommodation'])) {
                            $mainItineraryEvent = $e;
                            break;
                        }
                    }
                }

                // Priority 3: Just the first event
                if (!$mainItineraryEvent && !empty($allEvents)) {
                    $mainItineraryEvent = $allEvents[0];
                }

                // Final Title fallback
                $dayTitle = $mainItineraryEvent['subject'] ?? ($day['title'] ?? ($day['destination'] ?? ($day['location'] ?? 'Tour Day')));

                // Final Description fallback
                $combinedDesc = '';
                if ($mainItineraryEvent && (!empty($mainItineraryEvent['description']) || !empty($mainItineraryEvent['details']))) {
                    $descContent = $mainItineraryEvent['description'] ?? ($mainItineraryEvent['details'] ?? '');
                    $combinedDesc = nl2br(e($descContent));
                } else if (!empty($day['details'])) {
                    $combinedDesc = nl2br(e($day['details']));
                } else if (!empty($day['description'])) {
                    $combinedDesc = nl2br(e($day['description']));
                } else {
                    $combinedDesc = 'Sightseeing and travel as per the planned itinerary.';
                }
            @endphp

            <div style="border: 1px solid #ccc; margin-bottom: 15px; background-color: #fff;">
                <div style="background-color: #f8fafc; padding: 6px 12px; border-bottom: 1px solid #ccc;">
                    <table class="w-100">
                        <tr>
                            <td style="width: 25%; font-weight: bold; font-size: 11px;">DAY {{ $dayId }}</td>
                            <td style="text-align: center; font-weight: bold; font-size: 11px; color: #1e3a8a;">
                                {{ strtoupper($day['destination'] ?? ($day['location'] ?? 'TOUR DAY')) }}
                            </td>
                            <td style="width: 25%; text-align: right; font-weight: bold; font-size: 10px; color: #666;">
                                {{ $dayDate }}
                            </td>
                        </tr>
                    </table>
                </div>
                <table class="w-100">
                    <tr>
                        @if($displayImage)
                            <td style="width: 160px; padding: 10px; vertical-align: top;">
                                @php $dayBase64 = imageToBase64($displayImage); @endphp
                                @if($dayBase64)
                                    <img src="{{ $dayBase64 }}"
                                        style="width: 150px; height: 100px; object-fit: cover; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                @endif
                            </td>
                        @endif
                        <td style="padding: 12px; vertical-align: top;">
                            <!-- 1. NAME (Heading H) -->
                            <div
                                style="font-size: 11px; font-weight: bold; color: #1a1a1a; margin-bottom: 5px; text-transform: uppercase;">
                                {{ $dayTitle }}
                            </div>

                            <div style="font-size: 9px; line-height: 1.4;">
                                <!-- 2. MEAL PLAN -->
                                <div style="margin-bottom: 8px; border-bottom: 1px solid #eee; padding-bottom: 5px;">
                                    <strong>Meal Plan :</strong> <span
                                        style="color: #1e3a8a; font-weight: bold;">{{ strtoupper($dayMealPlan) }}</span>
                                </div>

                                <!-- 3. DESCRIPTION (D) -->
                                <div style="color: #333; line-height: 1.5;">
                                    {!! $combinedDesc !!}
                                </div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
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
                    <span style="float: left; font-weight: normal; font-style: italic;">{{ numberToWords($grandTotal) }}
                        Rupees Only</span>
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
                <td class="text-right" style="font-size: 11px; color: #b91c1c;">{{ number_format($balanceAmount, 2) }}
                </td>
            </tr>
        </tbody>
    </table>

    <div class="escalation-box">
        <table class="w-100">
            <tr>
                <td colspan="2" class="font-bold"
                    style="border-bottom: 0.5px solid #ccc; padding-bottom: 2px; margin-bottom: 5px;">
                    For any assistance/help please follow the escalation matrix given below
                </td>
            </tr>
            <tr>
                <td style="width: 50%">
                    <strong>Cab Booking Contact:-</strong> <br>
                    {{ $cabContact }}
                </td>
                <td>
                    <strong>Hotel Booking Contact:-</strong> <br>
                    {{ $hotelContact }}
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
            <li>Standard check-in time at the hotel is normally 1:00 pm and check-out is 11:00 am. An early check-in, or a
                late check-out is solely based on the discretion of the hotel.</li>
            <li>Transportation shall be provided as per the itinerary and will not be at disposal.</li>
            <li>AC will not be functional in hilly areas.</li>
            <li>Entrance fee, parking and guide charges are not included in the packages.</li>
            <li>Booking amount is subject to change in case of any changes in booked package.</li>
            <li>Airline seat and hotel is subject to availability at time of booking.</li>
            <li>Travelers furnishing incorrect age details may incur penalty at the time of travelling for airline and hotel
                booking in package.</li>
            <li>In case of unavailability in the listed hotels, arrangement for an alternate accommodation will be made in a
                hotel of similar category.</li>
            <li>The package price does not include expenditure expenses of personal nature.</li>
            <li>Meals Timings must be followed as per the instructed time of the hotels. For any un-availed meals we shall
                not be responsible.</li>
        @endif
    </ul>


</body>

</html>