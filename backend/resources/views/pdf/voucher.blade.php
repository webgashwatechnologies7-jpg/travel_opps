<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Travel Voucher - {{ $lead->client_name }}</title>
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
            line-height: 1.4;
            font-size: 11px;
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

        /* VOUCHER SPECIFIC */
        .voucher-label {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            text-align: center;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .voucher-id {
            text-align: center;
            font-size: 12px;
            color: #64748b;
            margin-bottom: 20px;
        }

        /* Content */
        .status-bar {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            color: #166534;
            padding: 8px 15px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-weight: bold;
        }

        .grid-2 {
            width: 100%;
            margin-bottom: 20px;
        }

        .grid-2 td {
            vertical-align: top;
            width: 50%;
        }

        .section-label {
            font-size: 9px;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 1px;
            font-weight: bold;
            margin-bottom: 5px;
        }

        .info-value {
            font-size: 14px;
            color: #0f172a;
            font-weight: bold;
        }

        .info-sub {
            font-size: 11px;
            color: #64748b;
        }

        .trip-details {
            background: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            border: 1px dashed #cbd5e1;
            margin-bottom: 20px;
        }

        .detail-row {
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
        }

        .detail-row:last-child {
            border-bottom: none;
        }

        .detail-row table {
            width: 100%;
        }

        .detail-label {
            color: #64748b;
            font-size: 11px;
        }

        .detail-data {
            font-weight: bold;
            color: #0f172a;
            text-align: right;
            font-size: 11px;
        }

        /* Footer */
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

        $company = $lead->company;
        $logo = $company && $company->logo ? imageToBase64($company->logo) : null;
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
                        {{ $company->phone }} | {{ $company->email }}
                    </div>
                @endif
            </td>
        </tr>
    </table>



    <div class="content">
        <div class="status-bar">
            <span>✓ Based on confirmed details for Query #{{ $lead->query_id ?? $lead->id }}</span>
        </div>

        <table class="grid-2">
            <tr>
                <td>
                    <span class="section-label">Guest Details</span>
                    <div class="info-value">{{ $lead->client_name }}</div>
                    <div class="info-sub">{{ $lead->phone }}</div>
                    <div class="info-sub">{{ $lead->email }}</div>
                </td>
                <td>
                    <span class="section-label">Travel Destination</span>
                    <div class="info-value" style="font-size: 18px;">{{ $lead->destination ?? 'TBA' }}</div>
                    <div class="info-sub">
                        {{ $lead->adult }} Adults
                        @if($lead->child > 0), {{ $lead->child }} Children @endif
                        @if($lead->infant > 0), {{ $lead->infant }} Infants @endif
                    </div>
                </td>
            </tr>
        </table>

        <div class="trip-details">
            <div class="detail-row">
                <table>
                    <tr>
                        <td class="detail-label">Check-in / Start Date</td>
                        <td class="detail-data">
                            {{ $lead->travel_start_date ? $lead->travel_start_date->format('d M, Y') : 'TBA' }}</td>
                    </tr>
                </table>
            </div>
            <div class="detail-row">
                <table>
                    <tr>
                        <td class="detail-label">Check-out / End Date</td>
                        <td class="detail-data">
                            {{ $lead->travel_end_date ? $lead->travel_end_date->format('d M, Y') : 'TBA' }}</td>
                    </tr>
                </table>
            </div>
            <div class="detail-row">
                <table>
                    <tr>
                        <td class="detail-label">Duration</td>
                        <td class="detail-data">
                            @if($lead->travel_start_date && $lead->travel_end_date)
                                {{ $lead->travel_start_date->diffInDays($lead->travel_end_date) + 1 }} Days
                            @else
                                TBA
                            @endif
                        </td>
                    </tr>
                </table>
            </div>
            <div class="detail-row">
                <table>
                    <tr>
                        <td class="detail-label">Service Type</td>
                        <td class="detail-data">Holiday Package / Travel Services</td>
                    </tr>
                </table>
            </div>
        </div>

        <div style="margin-top: 20px; color: #64748b; font-size: 10px;">
            <p><strong>Note:</strong> Please present this voucher upon arrival/check-in. This document confirms that
                your travel arrangements have been processed.</p>
        </div>
    </div>

    <div class="footer">
        Thank you for booking with {{ $lead->company->name ?? config('app.name') }}. Have a safe journey!<br>
        For support, call {{ $lead->company->phone ?? 'us' }} or email {{ $lead->company->email ?? '' }}.
    </div>

</body>

</html>