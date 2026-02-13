<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice - {{ $invoice->invoice_number }}</title>
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
            padding: 30px;
            line-height: 1.5;
            font-size: 11px;
        }

        /* HEADER */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            border-bottom: 2px solid #1e40af;
            padding-bottom: 15px;
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
            font-size: 20px;
            font-weight: bold;
            color: #1e40af;
            text-transform: uppercase;
            margin: 0;
        }

        .company-details {
            font-size: 10px;
            color: #64748b;
            margin-top: 4px;
        }

        /* INVOICE TITLE */
        .invoice-main-title {
            font-size: 28px;
            font-weight: bold;
            color: #1e40af;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .invoice-meta {
            color: #64748b;
            font-size: 12px;
            margin-bottom: 30px;
        }

        /* LAYOUT */
        .content-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .content-table td {
            vertical-align: top;
            width: 50%;
        }

        .section-title {
            font-size: 10px;
            text-transform: uppercase;
            color: #94a3b8;
            letter-spacing: 1px;
            font-weight: bold;
            margin-bottom: 8px;
        }

        .bill-to-name {
            font-size: 16px;
            font-weight: bold;
            color: #0f172a;
            margin-bottom: 5px;
        }

        .bill-to-details {
            font-size: 11px;
            color: #475569;
            line-height: 1.6;
        }

        /* ITEMS TABLE */
        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }

        .items-table th {
            background-color: #f8fafc;
            border-bottom: 1px solid #e2e8f0;
            padding: 12px;
            text-align: left;
            font-size: 10px;
            text-transform: uppercase;
            color: #64748b;
            font-weight: bold;
        }

        .items-table td {
            padding: 15px 12px;
            border-bottom: 1px solid #f1f5f9;
            vertical-align: middle;
        }

        .item-description {
            font-weight: bold;
            color: #0f172a;
            font-size: 13px;
        }

        /* AMOUNT BOX */
        .amount-container {
            text-align: right;
            margin-top: 20px;
        }

        .amount-box {
            display: inline-block;
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            padding: 20px 30px;
            border-radius: 8px;
            text-align: right;
        }

        .amount-label {
            font-size: 12px;
            color: #166534;
            margin-bottom: 5px;
            font-weight: 600;
        }

        .total-price {
            font-size: 24px;
            font-weight: 900;
            color: #16a34a;
        }

        /* STATUS BADGE */
        .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .status-paid {
            background-color: #dcfce7;
            color: #15803d;
        }

        .status-pending {
            background-color: #fef9c3;
            color: #854d0e;
        }

        /* FOOTER */
        .footer {
            margin-top: 50px;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
            text-align: center;
            color: #94a3b8;
            font-size: 10px;
        }

        .logo-img {
            max-height: 60px;
            max-width: 200px;
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

    $company = $invoice->lead->company;
    $companyLogo = $company ? $company->logo : \App\Models\Setting::getValue('company_logo');
    $companyName = $company ? $company->name : \App\Models\Setting::getValue('company_name', 'TravelOps');
    $companyAddress = $company ? $company->address : \App\Models\Setting::getValue('company_address');
    $companyPhone = $company ? $company->phone : \App\Models\Setting::getValue('company_phone');
    $companyEmail = $company ? $company->email : \App\Models\Setting::getValue('company_email');
    $base64Logo = imageToBase64($companyLogo);
@endphp

<body>
    <!-- Header Table -->
    <table class="header-table">
        <tr>
            <td class="header-logo-cell">
                @if($base64Logo)
                    <img src="{{ $base64Logo }}" class="logo-img" alt="Logo">
                @endif
            </td>
            <td class="header-info-cell">
                <div class="company-name" style="font-size:14px;">{{ $companyName }}</div>
                <div class="company-details">
                    @if($companyAddress)
                    <div>{{ $companyAddress }}</div> @endif
                    @if($companyPhone || $companyEmail)
                        <div>
                            @if($companyPhone) {{ $companyPhone }} @endif
                            @if($companyPhone && $companyEmail) | @endif
                            @if($companyEmail) {{ $companyEmail }} @endif
                        </div>
                    @endif
                </div>
            </td>
        </tr>
    </table>

    <div class="invoice-main-title">Invoice</div>
    <div class="invoice-meta">
        No: <strong>{{ $invoice->invoice_number }}</strong> |
        Date: <strong>{{ $invoice->created_at->format('d M, Y') }}</strong>
    </div>

    <table class="content-table">
        <tr>
            <td>
                <div class="section-title">Bill To</div>
                <div class="bill-to-name">{{ $invoice->lead->client_name }}</div>
                <div class="bill-to-details">
                    @if($invoice->lead->email)
                    <div>Email: {{ $invoice->lead->email }}</div> @endif
                    @if($invoice->lead->phone)
                    <div>Phone: {{ $invoice->lead->phone }}</div> @endif
                    @if($invoice->lead->destination)
                    <div>Destination: {{ $invoice->lead->destination }}</div> @endif
                </div>
            </td>
            <td style="text-align: right;">
                <div class="section-title">Status</div>
                <div class="status-badge {{ $invoice->status === 'paid' ? 'status-paid' : 'status-pending' }}">
                    {{ ucfirst($invoice->status ?? 'pending') }}
                </div>
            </td>
        </tr>
    </table>

    <table class="items-table">
        <thead>
            <tr>
                <th>Description</th>
                <th style="text-align: right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>
                    <div class="item-description">{{ $invoice->itinerary_name }}</div>
                    <div style="font-size: 10px; color: #64748b; margin-top: 4px;">Professional travel services and
                        itinerary management.</div>
                </td>
                <td style="text-align: right; font-size: 14px; font-weight: bold; color: #0f172a;">
                    {{ number_format($invoice->total_amount, 2) }} {{ $invoice->currency ?? 'INR' }}
                </td>
            </tr>
        </tbody>
    </table>

    <div class="amount-container">
        <div class="amount-box">
            <div class="amount-label">Total Payable</div>
            <div class="total-price">{{ $invoice->currency ?? 'INR' }} {{ number_format($invoice->total_amount, 2) }}
            </div>
        </div>
    </div>

    <div class="footer">
        Thank you for choosing {{ $companyName }}.<br>
        This is a computer-generated invoice and does not require a signature.
    </div>
</body>

</html>