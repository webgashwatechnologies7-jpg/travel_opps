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
            background-color: #fff;
            color: #334155;
            margin: 0;
            padding: 25px;
            /* Reduced padding */
            line-height: 1.4;
            /* Tighter line height */
            font-size: 11px;
            /* Slightly smaller base font */
        }

        /* HEADER */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 10px;
        }

        .header-logo-cell {
            vertical-align: middle;
            width: 50%;
        }

        .header-info-cell {
            vertical-align: middle;
            width: 50%;
            text-align: right;
        }

        .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #1e40af;
            text-transform: uppercase;
            margin: 0;
        }

        .company-details {
            font-size: 10px;
            color: #64748b;
            margin-top: 3px;
        }

        /* HERO */
        .proposal-title {
            text-align: center;
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .main-img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 15px;
        }

        /* INFO BAR (Compact) */
        .info-bar {
            background: #f1f5f9;
            border-radius: 30px;
            padding: 8px 15px;
            margin-bottom: 25px;
            border: 1px solid #e2e8f0;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
        }

        .info-table td {
            text-align: center;
            border-right: 1px solid #cbd5e1;
            padding: 0 8px;
        }

        .info-table td:last-child {
            border-right: none;
        }

        .info-label {
            font-size: 8px;
            color: #64748b;
            text-transform: uppercase;
            display: block;
        }

        .info-value {
            font-size: 11px;
            font-weight: bold;
            color: #0f172a;
        }

        /* ITINERARY */
        .section-heading {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 10px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 5px;
        }

        .day-box {
            margin-bottom: 15px;
            page-break-inside: avoid;
        }

        .day-header {
            background: #1e40af;
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 5px;
        }

        .day-content {
            padding-left: 5px;
        }

        .day-desc {
            font-size: 11px;
            color: #334155;
            margin-bottom: 5px;
            text-align: justify;
        }

        .svc-badge {
            background: #e2e8f0;
            color: #334155;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            margin-right: 5px;
            font-weight: bold;
        }

        /* POLICIES (Compact) */
        .policy-section {
            margin-top: 20px;
            page-break-inside: avoid;
        }

        .inc-exc-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
        }

        .inc-exc-table td {
            vertical-align: top;
            width: 50%;
            padding: 10px;
            border: 1px solid #e2e8f0;
        }

        .inc-title {
            font-weight: bold;
            color: #166534;
            font-size: 11px;
            margin-bottom: 5px;
            display: block;
        }

        .exc-title {
            font-weight: bold;
            color: #991b1b;
            font-size: 11px;
            margin-bottom: 5px;
            display: block;
        }

        .compact-list {
            padding-left: 15px;
            margin: 0;
            font-size: 10px;
        }

        .policy-text {
            font-size: 10px;
            color: #475569;
            margin-bottom: 10px;
            white-space: pre-wrap;
        }

        /* OPTIONS COMPARISON (Side by Side at Bottom) */
        .options-section {
            margin-top: 30px;
            page-break-inside: avoid;
            border-top: 2px solid #1e40af;
            padding-top: 20px;
        }

        .options-table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 15px 0;
        }

        .option-col {
            vertical-align: top;
            width: 50%;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            border-radius: 8px;
            padding: 0;
            overflow: hidden;
        }

        .opt-head {
            background: #1e40af;
            color: white;
            padding: 10px;
            text-align: center;
            font-weight: bold;
            font-size: 13px;
        }

        .opt-body {
            padding: 15px;
            min-height: 150px;
        }

        .opt-price {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            color: #1e40af;
            padding: 10px;
            background: #e0f2fe;
            border-top: 1px solid #cbd5e1;
        }

        /* FOOTER */
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
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
                    $apiPrefix = config('app.url');
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
        }

        $company = $quotation->lead->company;
        $logo = $company->logo ? imageToBase64($company->logo) : null;
        $mainImg = isset($quotation->itinerary['image']) ? imageToBase64($quotation->itinerary['image']) : null;
    @endphp

    <!-- HEADER -->
    <table class="header-table">
        <tr>
            <td class="header-logo-cell">
                @if($logo)
                    <img src="{{ $logo }}" style="max-height: 60px;">
                @elseif($company)
                    <div class="company-name">{{ $company->name }}</div>
                @else
                    <div class="company-name">{{ config('app.name') }}</div>
                @endif
            </td>
            <td class="header-info-cell">
                @if($company)
                    <div class="company-name" style="font-size:14px;">{{ $company->name }}</div>
                    <div class="company-details">
                        {{ $company->address }}<br>
                        {{ $company->phone }} @if($company->phone && $company->email) | @endif {{ $company->email }}
                    </div>
                @endif
            </td>
        </tr>
    </table>

    <!-- HERO & INFO -->
    <div class="proposal-title">{{ $quotation->itinerary['itinerary_name'] ?? 'Travel Proposal' }}</div>
    @if($mainImg) <img src="{{ $mainImg }}" class="main-img"> @endif

    <div class="info-bar">
        <table class="info-table">
            <tr>
                <td><span class="info-label">CLIENT</span><span
                        class="info-value">{{ $quotation->lead->client_name }}</span></td>
                <td><span class="info-label">DESTINATION</span><span
                        class="info-value">{{ $quotation->itinerary['destinations'] ?? 'N/A' }}</span></td>
                <td><span class="info-label">DATES</span><span
                        class="info-value">{{ $quotation->travel_start_date ? $quotation->travel_start_date->format('M d') : 'TBA' }}</span>
                </td>
                <td><span class="info-label">DURATION</span><span
                        class="info-value">{{ $quotation->itinerary['duration'] }}N /
                        {{ $quotation->itinerary['duration'] + 1 }}D</span></td>
                <td><span class="info-label">PAX</span><span class="info-value">{{ $quotation->adults }}A,
                        {{ $quotation->children }}C</span></td>
            </tr>
        </table>
    </div>

    <!-- ITINERARY -->
    <div class="section-heading">Itinerary</div>
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
                    continue; // Skip hotel here, showed in options
                elseif ($t == 'meal' || str_contains($t, 'transport') || $t == 'activity')
                    $svcs[] = ($t == 'activity' ? 'Act' : ($t == 'meal' ? 'Meal' : 'Trans')) . ': ' . $e['subject'];
                else
                    $desc .= $e['details'] . "\n";
            }
        @endphp
        <div class="day-box">
            <div class="day-header">DAY {{ $day }} - {{ $dayTitle }} <span
                    style="float:right; font-weight:normal;">{{ $quotation->travel_start_date ? $quotation->travel_start_date->copy()->addDays($day - 1)->format('D, M d') : '' }}</span>
            </div>
            <div class="day-content">
                <div class="day-desc">{!! nl2br(e(trim($desc))) !!}</div>
                @if(!empty($svcs))
                    <div style="font-size:10px; color:#64748b;">
                        @foreach($svcs as $s) <span class="svc-badge">{{ $s }}</span> @endforeach
                    </div>
                @endif
            </div>
        </div>
    @endforeach

    <!-- POLICIES -->
    <div class="policy-section">
        <div class="section-heading">Terms & Inclusions</div>
        <table class="inc-exc-table">
            <tr>
                <td style="background:#f0fdf4; border-color:#bbf7d0;">
                    <span class="inc-title">INCLUSIONS</span>
                    <ul class="compact-list">
                        @if(!empty($quotation->inclusions))
                            @foreach($quotation->inclusions as $inc) <li>{{ $inc }}</li> @endforeach
                        @elseif(isset($masterPolicies['inclusion']))
                            @foreach($masterPolicies['inclusion'] as $mp) <li>{!! $mp->content !!}</li> @endforeach
                        @else
                            <li>As per itinerary</li>
                        @endif
                    </ul>
                </td>
                <td style="background:#fef2f2; border-color:#fecaca;">
                    <span class="exc-title">EXCLUSIONS</span>
                    <ul class="compact-list">
                        @if(!empty($quotation->exclusions))
                            @foreach($quotation->exclusions as $exc) <li>{{ $exc }}</li> @endforeach
                        @elseif(isset($masterPolicies['exclusion']))
                            @foreach($masterPolicies['exclusion'] as $mp) <li>{!! $mp->content !!}</li> @endforeach
                        @else
                            <li>As per itinerary</li>
                        @endif
                    </ul>
                </td>
            </tr>
        </table>

        @php
            // Policy Fallback Logic: Custom Field -> Master Policy -> Company Default
            $pols = $quotation->custom_fields['policies'] ?? [];

            $getPol = function ($key) use ($masterPolicies) {
                return isset($masterPolicies[$key]) ? $masterPolicies[$key]->first()->content : null;
            };

            $terms = $pols['termsConditions'] ?? $getPol('terms') ?? $quotation->terms_conditions ?? $company->terms_and_conditions ?? null;
            $cancel = $pols['cancellationPolicy'] ?? $getPol('cancellation') ?? $company->cancellation_policy ?? null;
            $confirm = $pols['confirmationPolicy'] ?? $getPol('confirmation') ?? $company->confirmation_policy ?? null;
            $amend = $pols['amendmentPolicy'] ?? $getPol('amendment') ?? $company->amendment_policy ?? null;
            $remarks = $pols['remarks'] ?? $getPol('remarks') ?? $company->remarks ?? null;
            $payment = $pols['paymentPolicy'] ?? $getPol('payment') ?? null;
            $thankYou = $getPol('thank_you') ?? $getPol('thank_you_message') ?? null;

            $bank = $company->bank_details ?? null;

            $displayPolicies = [
                'Remarks' => $remarks,
                'Terms & Conditions' => $terms,
                'Confirmation Policy' => $confirm,
                'Cancellation Policy' => $cancel,
                'Amendment Policy' => $amend,
                'Payment Policy' => $payment,
                'Thank You Message' => $thankYou,
            ];
        @endphp

        @foreach($displayPolicies as $title => $content)
            @if(!empty($content))
                <div style="margin-bottom:8px;">
                    <strong style="font-size:10px; text-decoration:underline; text-transform:uppercase;">{{ $title }}</strong>
                    <div class="policy-text" style="font-size:10px;">{!! nl2br($content) !!}</div>
                </div>
            @endif
        @endforeach

        @if(!empty($bank))
            <div style="margin-top:10px; padding:10px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:4px;">
                <strong style="font-size:10px;">BANK DETAILS</strong>
                <div class="policy-text">{!! nl2br(e($bank)) !!}</div>
            </div>
        @endif
    </div>

    <!-- OPTIONS (Side by Side at Bottom) -->
    @php
        $customFields = is_array($quotation->custom_fields) ? $quotation->custom_fields : [];
        $hotelOptions = $customFields['hotel_options'] ?? [];
        $displayOption = $customFields['display_option'] ?? null;

        // If display_option is set, show only that option. Otherwise show all.
        if ($displayOption && isset($hotelOptions[$displayOption])) {
            $opts = [$displayOption];
        } else {
            $opts = array_keys($hotelOptions);
            sort($opts);
        }
    @endphp

    @if(!empty($opts))
        <div class="section-heading" style="margin-top:20px; page-break-before:auto;">
            @if($displayOption && count($opts) == 1)
                Confirmed Package
            @else
                Package Options
            @endif
        </div>
        <div class="options-section">
            <table class="options-table">
                <tr>
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
                        <td class="option-col"
                            style="vertical-align:top; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                            <div class="opt-head"
                                style="background:#1e40af; color:white; padding:8px; text-align:center; font-weight:bold;">
                                @if(count($opts) == 1 && $displayOption)
                                    Package Details
                                @else
                                    Option {{ $optNum }} Package
                                @endif
                            </div>
                            <div class="opt-body" style="padding:10px;">
                                @foreach($hOpts as $h)
                                    @php
                                        $extraStr = implode(' • ', array_filter([$h['roomName'] ?? null, $h['mealPlan'] ?? null]));
                                        $hImg = !empty($h['image']) ? imageToBase64($h['image']) : null;
                                     @endphp
                                    <div style="margin-bottom:12px; border-bottom:1px dashed #eee; padding-bottom:8px;">
                                        @if($hImg)
                                            <img src="{{ $hImg }}"
                                                style="width:100%; height:100px; object-fit:cover; border-radius:4px; margin-bottom:5px;">
                                        @endif
                                        <div style="font-weight:bold; color:#1e40af; font-size:12px;">★
                                            {{ $h['hotelName'] ?? 'Hotel' }}
                                        </div>
                                        <div style="font-size:10px; color:#64748b;">{{ $extraStr }}</div>
                                    </div>
                                @endforeach
                            </div>
                            <div class="opt-price"
                                style="background:#f0f9ff; padding:10px; text-align:center; font-weight:bold; color:#0369a1; border-top:1px solid #e2e8f0;">
                                {{ $quotation->currency }} {{ number_format($price, 0) }}
                            </div>
                        </td>
                    @endforeach
                    <!-- Fill empty cell if only 1 option to maintain width -->
                    @if(count($opts) == 1)
                    <td width="50%"></td> @endif
                </tr>
            </table>
        </div>
    @endif

    <!-- FOOTER -->
    <div class="footer">
        Thank you for choosing {{ $company->name }}!<br>
        {{ $company->phone }} | {{ $company->email }}
    </div>

</body>

</html>