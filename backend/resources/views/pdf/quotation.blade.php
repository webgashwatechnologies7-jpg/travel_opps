<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposal - {{ $quotation->lead->client_name ?? 'Guest' }}</title>
    <style>
        @page {
            margin: 0px;
            padding: 0px;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            background-color: #ffffff;
            color: #1e293b;
            margin: 0;
            padding: 20px 40px;
            line-height: 1.6;
            font-size: 11px;
        }

        /* COLORS */
        .text-primary {
            color: #1e3a8a;
        }

        .text-accent {
            color: #b45309;
        }

        .bg-primary {
            background-color: #1e3a8a;
        }

        .bg-light {
            background-color: #f8fafc;
        }

        /* HEADER */
        .header {
            width: 100%;
            border-bottom: 3px solid #1e3a8a;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e3a8a;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .company-info {
            font-size: 9px;
            color: #64748b;
            margin-top: 3px;
            line-height: 1.5;
        }

        /* HERO SECTION */
        .hero {
            position: relative;
            margin-bottom: 15px;
            border-radius: 10px;
            overflow: hidden;
            background: #0f172a;
        }

        .hero-img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            opacity: 0.8;
        }

        .hero-content {
            padding: 15px;
            text-align: center;
        }

        .proposal-title {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a8a;
            margin: 10px 0 12px;
            text-transform: uppercase;
            letter-spacing: 1px;
            padding-left: 12px;
            border-left: 4px solid #2563eb;
        }

        /* INFO ISLAND */
        .info-island {
            background: #f0f6ff;
            border-radius: 8px;
            padding: 10px 15px;
            margin-bottom: 15px;
            border: 1px solid #bfdbfe;
            border-left: 4px solid #1e3a8a;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 3px 8px;
            text-align: left;
        }

        .label {
            font-size: 7.5px;
            color: #1d4ed8;
            text-transform: uppercase;
            display: block;
            margin-bottom: 2px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }

        .value {
            font-size: 10px;
            font-weight: bold;
            color: #0f172a;
        }

        /* SECTION TITLES */
        .section-header {
            background: #1e3a8a;
            color: #ffffff;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: bold;
            margin: 15px 0 10px 0;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }

        /* ITINERARY TIMELINE */
        .day-card {
            margin-bottom: 12px;
            border-left: 2px solid #1e3a8a;
            padding-left: 18px;
            position: relative;
            page-break-inside: avoid;
        }

        .day-marker {
            position: absolute;
            left: -11px;
            top: 0;
            width: 20px;
            height: 20px;
            background: #1e3a8a;
            border-radius: 10px;
            z-index: 99;
            overflow: hidden;
        }

        .day-title {
            font-size: 12px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 6px;
        }

        .day-date {
            font-size: 8px;
            color: #475569;
            float: right;
            font-weight: normal;
            background: #e2e8f0;
            padding: 1px 7px;
            border-radius: 15px;
        }

        .day-body {
            background: #fcfcfc;
            padding: 6px;
            border-radius: 6px;
            border: 1px solid #eef2f7;
            color: #334155;
        }

        .event-item {
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #e2e8f0;
            display: block;
        }

        .event-item:last-child {
            margin-bottom: 0;
            padding-bottom: 0;
            border-bottom: none;
        }

        .event-img {
            width: 90px;
            height: 60px;
            border-radius: 5px;
            float: right;
            margin-left: 8px;
            object-fit: cover;
            border: 1px solid #cbd5e1;
        }

        .event-type-label {
            font-size: 7.5px;
            font-weight: bold;
            color: #2563eb;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            display: block;
            margin-bottom: 1px;
        }

        .event-subject {
            font-size: 10px;
            font-weight: bold;
            color: #1e293b;
            margin-bottom: 2px;
        }

        .event-details {
            font-size: 9px;
            color: #475569;
            line-height: 1.4;
            text-align: justify;
        }

        .svc-badge {
            display: inline-block;
            background: #eff6ff;
            color: #2563eb;
            padding: 1px 5px;
            border-radius: 3px;
            font-size: 7.5px;
            margin-right: 3px;
            margin-top: 3px;
            font-weight: bold;
            border: 1px solid #dbeafe;
        }

        /* INCLUSIONS / EXCLUSIONS */
        .policy-table {
            width: 100%;
            border-collapse: collapse;
        }

        .policy-cell {
            width: 50%;
            vertical-align: top;
            padding: 15px;
            border-radius: 10px;
        }

        .inc-cell {
            background: #f0fdf4;
            border: 1px solid #86efac;
        }

        .exc-cell {
            background: #fff1f2;
            border: 1px solid #fca5a5;
        }

        .policy-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 10px;
            display: block;
            text-transform: uppercase;
        }

        .inc-title {
            color: #166534;
        }

        .exc-title {
            color: #991b1b;
        }

        ul.policy-list {
            margin: 0;
            padding-left: 15px;
            font-size: 10px;
        }

        ul.policy-list li {
            margin-bottom: 5px;
        }

        /* HOTEL OPTIONS */
        .option-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            margin-bottom: 20px;
            overflow: hidden;
            page-break-inside: avoid;
        }

        .option-header {
            background: #1e3a8a;
            color: #ffffff;
            padding: 10px 16px;
            font-weight: bold;
            font-size: 11px;
            letter-spacing: 1.5px;
            text-transform: uppercase;
        }

        .option-content {
            padding: 15px;
        }

        .hotel-item {
            margin-bottom: 15px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 15px;
        }

        .hotel-item:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

        .hotel-name {
            font-size: 13px;
            font-weight: bold;
            color: #1e3a8a;
        }

        .hotel-meta {
            font-size: 10px;
            color: #64748b;
            margin-top: 2px;
        }

        .price-tag {
            background: #1e3a8a;
            color: #facc15;
            padding: 13px 18px;
            text-align: center;
            font-size: 18px;
            font-weight: bold;
            margin-top: 14px;
            border-radius: 8px;
        }

        /* FOOTER */
        .footer {
            margin-top: 40px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            color: #94a3b8;
            font-size: 9px;
        }
    </style>
</head>

<body>
    @php
        // IMAGE HELPER
        if (!function_exists('imageToBase64')) {
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
        }

        $company = $quotation->lead->company;
        $logo = $company->logo ? imageToBase64($company->logo) : null;
        $mainImg = isset($quotation->itinerary['image']) ? imageToBase64($quotation->itinerary['image']) : null;
    @endphp

    <!-- HEADER -->
    <div class="header">
        <table class="header-table">
            <tr>
                <td style="width: 60%;">
                    @if($logo)
                        <img src="{{ $logo }}" style="max-height: 55px;">
                    @else
                        <h1 class="company-name">{{ $company->name ?? config('app.name') }}</h1>
                    @endif
                </td>
                <td style="width: 40%; text-align: right;">
                    <div class="company-name" style="font-size: 12px;">{{ $company->name ?? '' }}</div>
                    <div class="company-info">
                        {{ $company->address ?? '' }}<br>
                        {{ $company->phone ?? '' }} | {{ $company->email ?? '' }}
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- PROPOSAL TITLE -->
    <div class="proposal-title">
        {!! html_entity_decode(html_entity_decode($quotation->title ?? $quotation->itinerary['itinerary_name'] ?? 'Customized Travel Proposal')) !!}
    </div>

    <!-- HERO IMAGE -->
    @if($mainImg)
        <div class="hero">
            <img src="{{ $mainImg }}" class="hero-img">
        </div>
    @endif

    <!-- QUICK INFO -->
    <div class="info-island">
        <table class="info-table">
            <tr>
                <td style="width: 25%;">
                    <span class="label">Primary Guest</span>
                    <span class="value">{{ $quotation->lead->client_name }}</span>
                </td>
                <td style="width: 25%;">
                    <span class="label">Destination</span>
                    <span class="value">{{ $quotation->itinerary['destinations'] ?? 'N/A' }}</span>
                </td>
                <td style="width: 25%;">
                    <span class="label">Travel Dates</span>
                    <span
                        class="value">{{ $quotation->travel_start_date ? $quotation->travel_start_date->format('d M Y') : 'TBA' }}</span>
                </td>
                <td style="width: 25%;">
                    <span class="label">Pax Details</span>
                    <span class="value">{{ $quotation->adults }} Adults, {{ $quotation->children }} Children</span>
                </td>
            </tr>
            <tr>
                <td colspan="4" style="padding-top: 10px; border-top: 1px solid #e2e8f0; margin-top: 5px;">
                    <span class="label">Duration</span>
                    <span class="value">{{ $quotation->itinerary['duration'] }} Nights /
                        {{ $quotation->itinerary['duration'] + 1 }} Days</span>
                </td>
            </tr>
        </table>
    </div>

    <!-- THANK YOU MESSAGE (NEW SECTION) -->
    @php
        $pols = $quotation->custom_fields['policies'] ?? [];
        $thankYou = $pols['thankYouMessage'] ?? null;
    @endphp
    @if(!empty($thankYou))
        <div style="margin-bottom: 12px; padding: 10px; background: #fefce8; border-radius: 8px; border: 1px solid #fef08a;">
             <div style="font-size: 11px; color: #854d0e; font-style: italic; line-height: 1.6; text-align: center;">
                 @if(is_array($thankYou))
                    @foreach($thankYou as $msg) {!! strip_tags($msg, '<strong><b><i><em>') !!}<br> @endforeach
                 @else
                    {!! nl2br(strip_tags($thankYou, '<strong><b><i><em>')) !!}
                 @endif
             </div>
        </div>
    @endif

    <!-- ITINERARY -->
    <div class="section-header">Detailed Itinerary</div>
    @php
        $dayEvents = $quotation->itinerary['day_events'] ?? [];
        $days = array_keys($dayEvents);
        sort($days, SORT_NUMERIC);
    @endphp

    @foreach($days as $day)
        @php
            $evts = $dayEvents[$day] ?? [];
            $dayTitle = "Day $day";
            // Pass 1: Find the Best Title for the Day
            foreach ($evts as $e) {
                $t = $e['eventType'] ?? '';
                // The 'day-itinerary' type with a custom subject is the top priority
                if ($t === 'day-itinerary' && $e['subject'] !== 'Day Itinerary') {
                    $dayTitle = $e['subject'];
                    break;
                }
                // Fallback: The first meaningful non-accommodation event
                if ($dayTitle === "Day $day" && $t !== 'accommodation' && $e['subject'] !== 'Day Itinerary') {
                    $dayTitle = $e['subject'];
                }
            }

            $renderEvents = [];
            $svcs = [];

            // Pass 2: Process All Events for Display
            foreach ($evts as $e) {
                $t = $e['eventType'] ?? '';
                if ($t == 'accommodation') {
                    continue;
                }

                // Collect service badge if it's a specific type
                if (in_array($t, ['meal', 'activity', 'day-itinerary']) || str_contains($t, 'transport')) {
                    $prefix = ($t == 'activity' ? 'Activity' : ($t == 'meal' ? 'Meal' : (str_contains($t, 'transport') ? 'Transfer' : 'Item')));
                    if ($prefix !== 'Item') {
                        $svcs[] = "$prefix: " . ($e['subject'] ?? '');
                    }
                }

                // Add to render list if there are details or it's a key event
                if (!empty($e['details']) || (!empty($e['subject']) && $e['subject'] !== 'Day Itinerary')) {
                    $renderEvents[] = [
                        'type' => $t,
                        'subject' => $e['subject'] ?? '',
                        'details' => $e['details'] ?? '',
                        'image' => !empty($e['image']) ? imageToBase64($e['image']) : null
                    ];
                }
            }
        @endphp
        <div class="day-card">
            <div class="day-marker">
                <table width="100%" height="100%" style="border-collapse: collapse;">
                    <tr>
                        <td align="center" valign="middle"
                            style="color: white; font-size: 10px; font-weight: bold; line-height: 1; padding-top: 4px;">
                            {{ $day }}
                        </td>
                    </tr>
                </table>
            </div>
            <div class="day-title">
                {!! html_entity_decode(html_entity_decode($dayTitle)) !!}
                <span
                    class="day-date">{{ $quotation->travel_start_date ? $quotation->travel_start_date->copy()->addDays($day - 1)->format('l, d M') : '' }}</span>
            </div>
            <div class="day-body">
                @foreach($renderEvents as $evt)
                    <div class="event-item">
                        @if($evt['image'])
                            <img src="{{ $evt['image'] }}" class="event-img">
                        @endif
                        <div class="event-type-label">{{ $evt['type'] }}</div>
                        <div class="event-subject">
                             {!! $evt['subject'] !!}
                        </div>
                        <div class="event-details">
                            {!! nl2br(strip_tags($evt['details'], '<strong><b><i><em>')) !!}
                        </div>
                        <div style="clear: both;"></div>
                    </div>
                @endforeach

                @if(!empty($svcs))
                    <div style="margin-top: 5px; border-top: 1px solid #f1f5f9; padding-top: 5px;">
                        @foreach($svcs as $s) <span class="svc-badge">{{ $s }}</span> @endforeach
                    </div>
                @endif
            </div>
        </div>
    @endforeach

    <!-- POLICIES BOX -->
    <div class="section-header">Terms & Inclusions</div>
    <table class="policy-table">
        <tr>
            <td class="policy-cell inc-cell" style="padding-right: 10px;">
                <span class="policy-title inc-title">✓ Inclusions</span>
                <ul class="policy-list">
                    @if(!empty($quotation->inclusions))
                        @foreach($quotation->inclusions as $inc) <li>{!! strip_tags($inc, '<strong><b><i><em>') !!}</li> @endforeach
                    @elseif(isset($masterPolicies['inclusion']))
                        @foreach($masterPolicies['inclusion'] as $mp) <li>{!! strip_tags($mp->content, '<strong><b><i><em>') !!}</li> @endforeach
                    @endif
                </ul>
            </td>
            <td style="width: 20px;"></td>
            <td class="policy-cell exc-cell">
                <span class="policy-title exc-title">✕ Exclusions</span>
                <ul class="policy-list">
                    @if(!empty($quotation->exclusions))
                        @foreach($quotation->exclusions as $exc) <li>{!! strip_tags($exc, '<strong><b><i><em>') !!}</li> @endforeach
                    @elseif(isset($masterPolicies['exclusion']))
                        @foreach($masterPolicies['exclusion'] as $mp) <li>{!! strip_tags($mp->content, '<strong><b><i><em>') !!}</li> @endforeach
                    @endif
                </ul>
            </td>
        </tr>
    </table>

    <!-- IMPORTANT POLICIES -->
    @php
        $getPol = function ($key) use ($masterPolicies) {
            return isset($masterPolicies[$key]) ? $masterPolicies[$key]->pluck('content')->toArray() : null;
        };

        $policyItems = [
            'General Remarks' => $pols['remarks'] ?? $getPol('remarks') ?? [],
            'Booking Terms & Conditions' => $pols['termsConditions'] ?? $getPol('terms') ?? $quotation->terms_conditions ?? [],
            'Confirmation Policy' => $pols['confirmationPolicy'] ?? $getPol('confirmation') ?? [],
            'Cancellation Policy' => $pols['cancellationPolicy'] ?? $getPol('cancellation') ?? [],
            'Amendment Policy' => $pols['amendmentPolicy'] ?? $getPol('amendment') ?? [],
            'Payment Policy' => $pols['paymentPolicy'] ?? $getPol('payment') ?? [],
        ];
    @endphp

    @foreach($policyItems as $title => $content)
        @if(!empty($content))
            <div style="margin-top: 10px; page-break-inside: avoid;">
                <div
                    style="font-weight: bold; color: #1e3a8a; border-bottom: 2px solid #cbd5e1; margin-bottom: 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
                    {{ $title }}
                </div>
                <div style="font-size: 9.5px; color: #475569; padding-left: 5px;">
                    @if(is_array($content))
                        @foreach($content as $item)
                             <div style="margin-bottom: 4px;">• {!! strip_tags($item, '<strong><b><i><em>') !!}</div>
                        @endforeach
                    @else
                        {!! nl2br(strip_tags($content, '<strong><b><i><em>')) !!}
                    @endif
                </div>
            </div>
        @endif
    @endforeach

    <!-- PACKAGE OPTIONS -->
    @php
        $customFields = is_array($quotation->custom_fields) ? $quotation->custom_fields : [];
        $hotelOptions = $customFields['hotel_options'] ?? [];
        $displayOption = $customFields['display_option'] ?? null;

        if ($displayOption && isset($hotelOptions[$displayOption])) {
            $opts = [$displayOption];
        } else {
            $opts = array_keys($hotelOptions);
            sort($opts);
        }
    @endphp

    @if(!empty($opts))
        <div class="section-header" style="margin-top: 10px;">Package Pricing & Hotel Options</div>
        @foreach($opts as $optNum)
            @php
                $hOpts = $hotelOptions[$optNum] ?? [];
                $pricing = $quotation->pricing_breakdown ?? [];
                $price = isset($pricing[$optNum])
                    ? (is_array($pricing[$optNum]) ? ($pricing[$optNum]['final'] ?? 0) : $pricing[$optNum])
                    : collect($hOpts)->sum(function ($h) {
                        return $h['price'] ?? 0;
                    });
            @endphp
            <div class="option-card">
                <div class="option-header">
                    @if(count($opts) == 1 && $displayOption)
                        CONFIRMED PACKAGE DETAILS
                    @else
                        PACKAGE OPTION {{ $optNum }}
                    @endif
                </div>
                <div class="option-content">
                    <table style="width: 100%; border-collapse: collapse;">
                        @foreach($hOpts as $h)
                            @php
                                $hotelImg = !empty($h['image']) ? imageToBase64($h['image']) : null;
                            @endphp
                            <tr class="hotel-item">
                                @if($hotelImg)
                                    <td style="width: 80px; padding: 6px 0; vertical-align: top;">
                                        <img src="{{ $hotelImg }}" style="width: 70px; height: 50px; object-fit: cover; border-radius: 5px; border: 1px solid #cbd5e1;">
                                    </td>
                                @endif
                                <td style="padding: 6px 0; vertical-align: top;">
                                    <div class="hotel-name">★
                                        {!! html_entity_decode(html_entity_decode($h['hotelName'] ?? 'Selected Hotel')) !!}
                                    </div>
                                    <div class="hotel-meta">
                                        {{ $h['roomName'] ?? 'Standard Room' }} • {{ $h['mealPlan'] ?? 'As per Plan' }}
                                    </div>
                                    @if(!empty($h['details']))
                                        <div style="font-size: 8.5px; color: #64748b; margin-top: 3px; line-height: 1.4;">
                                            {!! nl2br(e($h['details'])) !!}
                                        </div>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </table>
                    @php
                        $showPrice = $customFields['show_price'] ?? true;
                    @endphp

                    @if($showPrice)
                        <div class="price-tag">
                            Total Package Cost: {{ $quotation->currency }} {{ number_format($price, 0) }}
                        </div>
                    @endif
                </div>
            </div>
        @endforeach
    @endif

    <!-- FINAL FOOTER WITH TRIP IMAGE BACKGROUND -->
    <div
        style="margin-top: 50px; position: relative; border-radius: 15px; overflow: hidden; background-color: #0f172a; height: 150px;">
        @if($mainImg)
            <img src="{{ $mainImg }}" style="width: 100%; height: 150px; object-fit: cover; opacity: 0.3;">
        @endif
        <table width="100%" height="150" style="position: absolute; top: 0; left: 0; border-collapse: collapse;">
            <tr>
                <td align="center" valign="middle" style="padding: 20px; color: white;">
                    <p style="font-size: 9px; opacity: 0.7; margin: 0 0 10px 0;">This is a computer-generated proposal.
                        Quotations are subject to availability at the time of booking.</p>
                    <h2 style="font-size: 18px; font-weight: bold; margin: 5px 0; color: #facc15;">Thank you for
                        choosing {{ $company->name ?? 'our services' }}!</h2>
                    <p style="font-size: 11px; opacity: 0.9; margin: 5px 0;">
                        {{ $company->phone ?? '' }} @if($company->phone && $company->email) | @endif
                        {{ $company->email ?? '' }}
                    </p>
                    @if($company->website)
                        <p style="font-size: 11px; opacity: 0.9; margin: 0;">{{ $company->website }}</p>
                    @endif
                </td>
            </tr>
        </table>
    </div>

</body>

</html>