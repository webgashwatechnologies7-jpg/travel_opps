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
            line-height: 1.5;
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
            padding-bottom: 15px;
            margin-bottom: 25px;
        }

        .header-table {
            width: 100%;
            border-collapse: collapse;
        }

        .company-name {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a8a;
            margin: 0;
            text-transform: uppercase;
        }

        .company-info {
            font-size: 9px;
            color: #64748b;
            margin-top: 4px;
        }

        /* HERO SECTION */
        .hero {
            position: relative;
            margin-bottom: 30px;
            border-radius: 12px;
            overflow: hidden;
            background: #0f172a;
        }

        .hero-img {
            width: 100%;
            height: 250px;
            object-fit: cover;
            opacity: 0.8;
        }

        .hero-content {
            padding: 20px;
            text-align: center;
        }

        .proposal-title {
            font-size: 26px;
            font-weight: bold;
            color: #1e3a8a;
            margin: 15px 0;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* INFO ISLAND */
        .info-island {
            background: #f1f5f9;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 30px;
            border-left: 5px solid #1e3a8a;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            padding: 5px 10px;
            text-align: left;
        }

        .label {
            font-size: 8px;
            color: #64748b;
            text-transform: uppercase;
            display: block;
            margin-bottom: 2px;
            font-weight: bold;
        }

        .value {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
        }

        /* SECTION TITLES */
        .section-header {
            background: #1e3a8a;
            color: white;
            padding: 8px 15px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            margin: 25px 0 15px 0;
            text-transform: uppercase;
        }

        /* ITINERARY TIMELINE */
        .day-card {
            margin-bottom: 20px;
            border-left: 2px dashed #cbd5e1;
            padding-left: 25px;
            position: relative;
            page-break-inside: avoid;
        }

        .day-marker {
            position: absolute;
            left: -11px;
            top: -4px;
            /* Shifted further up to match title baseline */
            width: 20px;
            height: 20px;
            background: #1e3a8a;
            border-radius: 10px;
            z-index: 99;
            overflow: hidden;
        }

        .day-title {
            font-size: 13px;
            font-weight: bold;
            color: #1e3a8a;
            margin-bottom: 8px;
        }

        .day-date {
            font-size: 10px;
            color: #64748b;
            float: right;
            font-weight: normal;
        }

        .day-body {
            background: #fafafa;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid #f1f5f9;
        }

        .svc-badge {
            display: inline-block;
            background: #e0f2fe;
            color: #0369a1;
            padding: 3px 8px;
            border-radius: 4px;
            font-size: 9px;
            margin-right: 5px;
            margin-top: 5px;
            font-weight: bold;
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
            border: 1px solid #bbf7d0;
        }

        .exc-cell {
            background: #fef2f2;
            border: 1px solid #fecaca;
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
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            margin-bottom: 25px;
            overflow: hidden;
            page-break-inside: avoid;
        }

        .option-header {
            background: #1e3a8a;
            color: white;
            padding: 10px 15px;
            font-weight: bold;
            font-size: 13px;
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
            background: #fffbeb;
            border: 1px solid #fde68a;
            color: #92400e;
            padding: 10px;
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-top: 10px;
            border-radius: 6px;
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
        {!! html_entity_decode(html_entity_decode($quotation->itinerary['itinerary_name'] ?? 'Customized Travel Proposal')) !!}
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
            $desc = "";
            $svcs = [];
            foreach ($evts as $e) {
                if ($e['subject'] != 'Day Itinerary')
                    $dayTitle = $e['subject'];
                $t = $e['eventType'] ?? '';
                if ($t == 'accommodation')
                    continue;
                elseif ($t == 'meal' || str_contains($t, 'transport') || $t == 'activity')
                    $svcs[] = ($t == 'activity' ? 'Activity' : ($t == 'meal' ? 'Meal' : 'Transfer')) . ': ' . $e['subject'];
                else
                    $desc .= $e['details'] . "\n";
            }
        @endphp
        <div class="day-card">
            <div class="day-marker">
                <table width="100%" height="20" style="border-collapse: collapse;">
                    <tr>
                        <td align="center" valign="middle"
                            style="color: white; font-size: 10px; font-weight: bold; line-height: 20px;">
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
                <div style="text-align: justify;">{!! nl2br(e(trim($desc))) !!}</div>
                @if(!empty($svcs))
                    <div style="margin-top: 10px;">
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
                        @foreach($quotation->inclusions as $inc) <li>{{ $inc }}</li> @endforeach
                    @elseif(isset($masterPolicies['inclusion']))
                        @foreach($masterPolicies['inclusion'] as $mp) <li>{!! strip_tags($mp->content) !!}</li> @endforeach
                    @endif
                </ul>
            </td>
            <td style="width: 20px;"></td>
            <td class="policy-cell exc-cell">
                <span class="policy-title exc-title">✕ Exclusions</span>
                <ul class="policy-list">
                    @if(!empty($quotation->exclusions))
                        @foreach($quotation->exclusions as $exc) <li>{{ $exc }}</li> @endforeach
                    @elseif(isset($masterPolicies['exclusion']))
                        @foreach($masterPolicies['exclusion'] as $mp) <li>{!! strip_tags($mp->content) !!}</li> @endforeach
                    @endif
                </ul>
            </td>
        </tr>
    </table>

    <!-- IMPORTANT POLICIES -->
    @php
        $pols = $quotation->custom_fields['policies'] ?? [];
        $getPol = function ($key) use ($masterPolicies) {
            return isset($masterPolicies[$key]) ? $masterPolicies[$key]->first()->content : null;
        };

        $terms = $pols['termsConditions'] ?? $getPol('terms') ?? $quotation->terms_conditions ?? null;
        $cancel = $pols['cancellationPolicy'] ?? $getPol('cancellation') ?? null;

        $policyItems = [
            'Booking Terms & Conditions' => $terms,
            'Cancellation Policy' => $cancel,
        ];
    @endphp

    @foreach($policyItems as $title => $content)
        @if(!empty($content))
            <div style="margin-top: 15px;">
                <div
                    style="font-weight: bold; color: #1e3a8a; border-bottom: 1px solid #e2e8f0; margin-bottom: 5px; font-size: 10px; text-transform: uppercase;">
                    {{ $title }}
                </div>
                <div style="font-size: 9px; color: #475569;">{!! nl2br(strip_tags($content)) !!}</div>
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
        <div class="section-header">Package Pricing & Hotel Options</div>
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
                            <tr class="hotel-item">
                                <td style="padding: 10px 0;">
                                    <div class="hotel-name">★
                                        {!! html_entity_decode(html_entity_decode($h['hotelName'] ?? 'Selected Hotel')) !!}
                                    </div>
                                    <div class="hotel-meta">
                                        {{ $h['roomName'] ?? 'Standard Room' }} • {{ $h['mealPlan'] ?? 'As per Plan' }}
                                    </div>
                                </td>
                            </tr>
                        @endforeach
                    </table>
                    <div class="price-tag">
                        Total Package Cost: {{ $quotation->currency }} {{ number_format($price, 0) }}
                    </div>
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