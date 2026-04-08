<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirmation Voucher - {{ $lead->query_id ?? $lead->id }}</title>
    <style>
        @page {
            margin: 0px;
            padding: 0px;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            background-color: #fff;
            color: #333;
            margin: 0;
            padding: 20px 40px;
            line-height: 1.3;
            font-size: 10px;
        }

        /* HEADER */
        .header {
            width: 100%;
            margin-bottom: 15px;
        }

        .logo-img {
            max-height: 60px;
            max-width: 160px;
        }

        .voucher-title-section {
            text-align: right;
            vertical-align: top;
        }

        .voucher-date {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .voucher-label {
            font-size: 16px;
            font-weight: bold;
            color: #444;
            text-transform: uppercase;
        }

        /* INFO SECTION */
        .info-container {
            width: 100%;
            margin-bottom: 20px;
        }

        .info-table {
            width: 60%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 3px 0;
            vertical-align: top;
        }

        .info-label {
            font-weight: bold;
            width: 120px;
        }

        .info-separator {
            width: 15px;
            text-align: center;
        }

        .badge-booking {
            background-color: #10b981;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
        }

        .badge-guest {
            background-color: #4f46e5;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
        }

        .qr-section {
            width: 40%;
            text-align: right;
            vertical-align: middle;
        }

        .qr-code {
            width: 100px;
            height: 100px;
        }

        .voucher-no {
            font-size: 10px;
            margin-top: 5px;
            color: #666;
        }

        /* SECTIONS */
        .section-header {
            background-color: #d1d5db;
            color: #2D3192;
            padding: 4px 10px;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
            margin-bottom: 5px;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .data-table th {
            background-color: #d1d5db;
            border: 1px solid #9ca3af;
            padding: 4px 6px;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
            color: #374151;
        }

        .data-table td {
            border: 1px solid #9ca3af;
            padding: 6px;
            font-size: 9px;
            vertical-align: top;
        }

        /* IMPORTANT NOTES */
        .notes-section {
            margin-top: 20px;
        }

        .notes-title {
            color: #2D3192;
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 8px;
            text-transform: uppercase;
        }

        .notes-list {
            padding-left: 15px;
            margin: 0;
        }

        .notes-list li {
            margin-bottom: 4px;
            font-size: 9px;
            color: #4b5563;
        }

        /* WISH MESSAGE */
        .wish-message {
            text-align: center;
            color: #C42771;
            font-weight: bold;
            font-size: 11px;
            margin: 30px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* ADDRESS FOOTER */
        .footer-address {
            background-color: #f3f4f6;
            border: 1px solid #cbd5e1;
            padding: 10px;
            text-align: center;
        }

        .footer-title {
            font-weight: bold;
            color: #1e40af;
            font-size: 10px;
            margin-bottom: 3px;
        }

        .footer-text {
            font-size: 9px;
            color: #4b5563;
        }
    </style>
</head>

@php
    function imageToBase64($url)
    {
        try {
            if (empty($url))
                return null;
            $parsed = parse_url($url);
            $relativePath = $parsed['path'] ?? '';
            if ($relativePath) {
                $relativePath = ltrim($relativePath, '/');
                $publicPath = public_path($relativePath);
                if (file_exists($publicPath)) {
                    $type = pathinfo($publicPath, PATHINFO_EXTENSION);
                    $data = file_get_contents($publicPath);
                    return 'data:image/' . $type . ';base64,' . base64_encode($data);
                }
                if (strpos($relativePath, 'storage/') === 0) {
                    $innerPath = substr($relativePath, 8);
                    $storagePath = storage_path('app/public/' . $innerPath);
                    if (file_exists($storagePath)) {
                        $type = pathinfo($storagePath, PATHINFO_EXTENSION);
                        $data = file_get_contents($storagePath);
                        return 'data:image/' . $type . ';base64,' . base64_encode($data);
                    }
                }
            }
            $ctx = stream_context_create(['ssl' => ['verify_peer' => false], 'http' => ['timeout' => 5]]);
            $data = @file_get_contents($url, false, $ctx);
            if ($data)
                return 'data:image/jpg;base64,' . base64_encode($data);
            return null;
        } catch (\Exception $e) {
            return null;
        }
    }

    $company = $lead->company;
    $companyLogo = $company ? $company->logo : \App\Models\Setting::getValue('company_logo');
    $companyName = $company ? $company->name : \App\Models\Setting::getValue('company_name', 'TravelFusion CRM');
    $companyEmail = $company ? $company->email : \App\Models\Setting::getValue('company_email');
    $companyPhone = $company ? $company->phone : \App\Models\Setting::getValue('company_phone');
    $companyAddress = $company ? $company->address : \App\Models\Setting::getValue('company_address');
    $companyDomain = $company ? $company->getFullUrlAttribute() : config('app.url');
    $base64Logo = imageToBase64($companyLogo);

    $bookingCode = $lead->query_id ?? ('#' . str_pad($lead->id, 6, '0', STR_PAD_LEFT));
    $voucherNo = $invoice ? $invoice->invoice_number : ('VHR' . str_pad($lead->id, 6, '0', STR_PAD_LEFT));

    // QR Code API
    $qrData = $bookingCode . ' | ' . $lead->client_name;
    $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($qrData);

    // Extracting Hotel Data
    $hotelDetails = [];
    if ($quotation && isset($quotation->custom_fields['hotel_options'][$confirmedOption])) {
        $hotelDetails = $quotation->custom_fields['hotel_options'][$confirmedOption];
    }

    // Extracting Tour & Departure Data
    $tourDetails = [];
    $departureDetails = [];
    if($quotation && isset($quotation->itinerary['day_events'])) {
        foreach($quotation->itinerary['day_events'] as $dayNum => $events) {
            foreach($events as $event) {
                $type = $event['eventType'] ?? '';
                $subject = strtolower($event['subject'] ?? '');
                
                if($type == 'activity' || ($type == 'transport' && !str_contains($subject, 'flight') && !str_contains($subject, 'airport'))) {
                    $tourDetails[] = [
                        'day' => $dayNum,
                        'name' => $event['subject'],
                        'type' => $type == 'activity' ? 'Activity' : 'Transfer',
                        'time' => $event['time'] ?? 'TBA',
                        'details' => $event['details'] ?? ''
                    ];
                } elseif($type == 'flight' || str_contains($subject, 'flight') || str_contains($subject, 'airport')) {
                    $departureDetails[] = [
                        'day' => $dayNum,
                        'name' => $event['subject'],
                        'type' => 'Flight/Transfer',
                        'time' => $event['time'] ?? 'TBA',
                        'details' => $event['details'] ?? ''
                    ];
                }
            }
        }
    }
@endphp

<body>
    <table class="header">
        <tr>
            <td>
                @if($base64Logo)
                    <img src="{{ $base64Logo }}" class="logo-img" alt="Logo">
                @endif
            </td>
            <td class="voucher-title-section">
                <div class="voucher-date">{{ now()->format('d-m-Y') }}</div>
                <div class="voucher-label">Confirmation Voucher</div>
            </td>
        </tr>
    </table>

    <table class="info-container">
        <tr>
            <td style="width: 60%; vertical-align: top;">
                <table class="info-table">
                    <tr>
                        <td class="info-label">Booking Code</td>
                        <td class="info-separator">:</td>
                        <td>{{ $bookingCode }} <span class="badge-booking">{{ $companyName }}</span></td>
                    </tr>
                    <tr>
                        <td class="info-label">Guest Name</td>
                        <td class="info-separator">:</td>
                        <td>{{ $lead->client_name }} <span class="badge-guest">Main Ver</span></td>
                    </tr>
                    <tr>
                        <td class="info-label">Guest Email</td>
                        <td class="info-separator">:</td>
                        <td>{{ $lead->email }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Guest Contact No</td>
                        <td class="info-separator">:</td>
                        <td>{{ $lead->phone }}</td>
                    </tr>
                    <tr>
                        <td class="info-label">Total pax</td>
                        <td class="info-separator">:</td>
                        <td>{{ ($lead->adult + $lead->child + $lead->infant) }}</td>
                    </tr>
                    @if($quotation && !empty($quotation->itinerary['routing']))
                    <tr>
                        <td class="info-label">Routing</td>
                        <td class="info-separator">:</td>
                        <td style="color: #2D3192; font-weight: bold;">{{ $quotation->itinerary['routing'] }}</td>
                    </tr>
                    @endif
                    <tr>
                        <td class="info-label">Adult : {{ $lead->adult }}, Child : {{ $lead->child }}, Infant :
                            {{ $lead->infant }}</td>
                        <td colspan="2"></td>
                    </tr>
                </table>
            </td>
            <td class="qr-section">
                <img src="{{ $qrUrl }}" class="qr-code" alt="QR Code">
                <div class="voucher-no">Voucher No.: {{ $voucherNo }}</div>
            </td>
        </tr>
    </table>

    <!-- HOTEL DETAILS -->
    <div class="section-header">Hotel Details</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="12%">Check In</th>
                <th width="12%">Check Out</th>
                <th width="20%">Hotel Name</th>
                <th width="15%">Room Category</th>
                <th width="8%">Meal</th>
                <th width="10%">No of Rooms</th>
                <th width="10%">Confirmation</th>
                <th width="13%">Remarks</th>
            </tr>
        </thead>
        <tbody>
            @if(!empty($hotelDetails))
                @foreach($hotelDetails as $hotel)
                    <tr>
                        <td>{{ $lead->travel_start_date ? $lead->travel_start_date->format('d-m-Y') : 'TBA' }}</td>
                        <td>{{ $lead->travel_end_date ? $lead->travel_end_date->format('d-m-Y') : 'TBA' }}</td>
                        <td>{{ $hotel['hotelName'] ?? 'Selected Hotel' }}</td>
                        <td>{{ $hotel['roomName'] ?? 'Standard Room' }}</td>
                        <td>{{ $hotel['mealPlan'] ?? 'As per Plan' }}</td>
                        <td>{{ $hotel['roomCount'] ?? 1 }}</td>
                        <td>{{ $hotel['confirmationNo'] ?? 'Pending' }}</td>
                        <td>{{ $hotel['remarks'] ?? '' }}</td>
                    </tr>
                @endforeach
            @else
                <tr>
                    <td colspan="8" style="text-align: center;">No hotel details available</td>
                </tr>
            @endif
        </tbody>
    </table>

    <!-- TOUR DETAILS -->
    @if(!empty($tourDetails))
        <div class="section-header">Tour Details</div>
        <table class="data-table">
            <thead>
                <tr>
                    <th width="12%">Tour Date</th>
                    <th width="25%">Tour Name</th>
                    <th width="12%">Transfer Type</th>
                    <th width="10%">Pickup Time</th>
                    <th width="10%">Pickup From</th>
                    <th width="10%">Drop At</th>
                    <th width="10%">Drop-up Time</th>
                    <th width="11%">Remarks</th>
                </tr>
            </thead>
            <tbody>
                @foreach($tourDetails as $tour)
                    <tr>
                        <td>{{ $lead->travel_start_date ? $lead->travel_start_date->copy()->addDays($tour['day'] - 1)->format('d-m-Y') : 'Day ' . $tour['day'] }}
                        </td>
                        <td>{{ $tour['name'] }}</td>
                        <td>{{ $tour['type'] }}</td>
                        <td>{{ $tour['time'] }}</td>
                        <td>Hotel / Airport</td>
                        <td>Airport / Hotel</td>
                        <td>{{ $tour['drop_time'] ?? 'Hrs' }}</td>
                        <td>{{ $tour['details'] }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <!-- DEPARTURE DETAILS -->
    @if(!empty($departureDetails))
    <div class="section-header">Departure Details</div>
    <table class="data-table">
        <thead>
            <tr>
                <th width="12%">Date</th>
                <th width="25%">Activity</th>
                <th width="12%">Transfer Type</th>
                <th width="12%">Flight No.</th>
                <th width="12%">Arrival Time</th>
                <th width="12%">Pick From</th>
                <th width="12%">Drop At</th>
                <th width="15%">Remark</th>
            </tr>
        </thead>
        <tbody>
            @foreach($departureDetails as $dep)
                <tr>
                    <td>{{ $lead->travel_start_date ? $lead->travel_start_date->copy()->addDays($dep['day'] - 1)->format('d-m-Y') : 'Day ' . $dep['day'] }}</td>
                    <td>{{ $dep['name'] }}</td>
                    <td>{{ $dep['type'] }}</td>
                    <td>{{ $dep['flight_no'] ?? 'TBA' }}</td>
                    <td>{{ $dep['time'] }}</td>
                    <td>Airport/Hotel</td>
                    <td>Hotel/Airport</td>
                    <td>{{ $dep['details'] }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- IMPORTANT NOTES -->
    <div class="notes-section">
        <div class="notes-title">Important Notes :</div>
        <ul class="notes-list">
            <li>Rooms are subject to availability at the time of confirmation.</li>
            <li>Please carry a valid Passport and photo identity proof for all the travellers.</li>
            <li>In Case of Cancellation in Flight, Bad Weather or Any other Disruption, there is no refund of hotels.
            </li>
            <li>Standard check-in time is 02:00 pm and check out time is 10:00 am at most of the hotels.</li>
            <li>Late check out as per availability only, although guaranteed check out is possible paying at additional
                cost.</li>
            <li>Issues regarding child age to be settled with hotels directly.</li>
            <li>All sightseeing will be depended as per Transport/Ferry timing.</li>
        </ul>
    </div>

    <div class="wish-message">************************* WISH YOU ALL THE BEST & HAPPY JOURNEY *************************
    </div>

    <div class="footer-address">
        <div class="footer-title">{{ $companyName }}</div>
        <div class="footer-text">
            {{ $companyAddress }}<br>
            Tel : {{ $companyPhone }}<br>
            Email : {{ $companyEmail }} | {{ $companyDomain }}
        </div>
    </div>
</body>

</html>