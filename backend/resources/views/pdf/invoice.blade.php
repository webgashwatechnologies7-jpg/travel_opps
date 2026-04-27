<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proforma Invoice - {{ $invoice->invoice_number }}</title>
    <style>
        @page {
            margin: 0px;
            padding: 0px;
        }

        body {
            font-family: 'DejaVu Sans', sans-serif;
            background-color: #fff;
            color: #000;
            margin: 0;
            padding: 0;
            line-height: 1.4;
            font-size: 11px;
            position: relative;
            min-height: 100vh;
        }

        /* CORNER ACCENTS */
        .corner-accent {
            position: absolute;
            width: 0;
            height: 0;
            border-style: solid;
            z-index: -1;
        }

        .top-left {
            top: 0;
            left: 0;
            border-width: 80px 80px 0 0;
            border-color: #2D3192 transparent transparent transparent;
        }

        .bottom-right {
            bottom: 0;
            right: 0;
            border-width: 0 0 80px 80px;
            border-color: transparent transparent #2D3192 transparent;
        }

        .container {
            padding: 40px 50px 150px 50px;
        }

        /* HEADER */
        .header {
            width: 100%;
            margin-bottom: 20px;
        }

        .invoice-title {
            font-size: 24px;
            font-weight: bold;
            color: #1a1a1a;
            margin: 0;
            margin-top: 10px;
        }

        .company-subtitle {
            font-size: 14px;
            color: #333;
            margin-bottom: 20px;
        }

        .logo-container {
            text-align: right;
            vertical-align: top;
        }

        .logo-img {
            max-height: 80px;
            max-width: 150px;
        }

        .invoice-info {
            text-align: right;
            margin-top: 5px;
        }

        .info-row {
            margin-bottom: 2px;
            font-size: 12px;
        }

        /* BILL TO */
        .bill-to-section {
            width: 100%;
            margin-bottom: 30px;
        }

        .bill-to-title {
            font-weight: bold;
            font-size: 13px;
            margin-bottom: 5px;
        }

        .bill-to-row {
            margin-bottom: 3px;
            font-size: 11px;
        }

        .bill-to-label {
            display: inline-block;
            width: 90px;
        }

        /* TABLE */
        .main-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .main-table th {
            background-color: #000;
            color: #fff;
            text-align: left;
            padding: 8px 12px;
            font-size: 11px;
            font-weight: bold;
        }

        .main-table td {
            padding: 10px 12px;
            border-bottom: 1px solid #eee;
            vertical-align: top;
            font-size: 11px;
        }

        /* SUMMARY */
        .summary-container {
            width: 100%;
            margin-top: 10px;
        }

        .summary-table {
            width: 300px;
            margin-left: auto;
            border-collapse: collapse;
        }

        .summary-table td {
            padding: 4px 0;
            font-size: 10px;
        }

        .summary-label {
            text-align: right;
            padding-right: 20px;
            font-weight: bold;
            text-transform: uppercase;
        }

        .summary-value {
            text-align: right;
            width: 100px;
            font-weight: bold;
        }

        .total-row td {
            border-top: 1px solid #000;
            padding-top: 8px;
            font-size: 12px;
        }

        /* IN WORDS */
        .words-section {
            margin-top: 25px;
            font-size: 11px;
        }

        .words-row {
            margin-bottom: 5px;
        }

        /* TERMS */
        .terms-section {
            margin-top: 30px;
        }

        .terms-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 8px;
        }

        .terms-list {
            padding-left: 15px;
            margin: 0;
        }

        .terms-list li {
            margin-bottom: 3px;
            font-size: 10px;
        }

        /* FOOTER */
        .footer {
            position: absolute;
            bottom: 40px;
            left: 50px;
            right: 50px;
            border-top: 1px solid #ccc;
            padding-top: 15px;
        }

        .footer-table {
            width: 100%;
        }

        .footer-cell {
            width: 50%;
            vertical-align: top;
            font-size: 10px;
            color: #333;
        }

        .footer-icon {
            display: inline-block;
            font-weight: bold;
            color: {{ $invoice->lead->company ? '#2D3192' : '#000' }};
            margin-right: 5px;
            font-size: 9px;
        }
        /* EXTREMELY COMPACT LAYOUT */
        body { margin: 0; padding: 0; }
        .payment-block {
            margin-top: 5px;
            border: 1px solid #000;
        }

        .payment-header {
            background-color: #000;
            color: #fff;
            padding: 3px 10px;
            font-weight: bold;
            font-size: 11px;
            text-transform: uppercase;
        }

        .bank-info-td {
            padding: 5px;
            vertical-align: top;
        }

        .bank-details-subtable td {
            padding: 1px 0;
            font-size: 10px;
            border-bottom: 1px solid #f9f9f9;
        }

        .label-text {
            color: #666;
            font-weight: bold;
            width: 100px;
            font-size: 8px;
            text-transform: uppercase;
        }

        .value-text {
            color: #000;
            font-weight: bold;
            font-size: 10px;
        }

        .qr-placeholder {
            width: 110px;
            text-align: center;
            border-left: 1px solid #eee;
            background-color: #fafafa;
            padding: 5px;
        }

        .qr-img-large {
            width: 75px;
            height: 75px;
        }

        .payment-footer {
            background-color: #fffafa;
            color: #d32f2f;
            padding: 4px;
            text-align: center;
            font-weight: bold;
            font-size: 10px;
        }

        /* TIGHTEN ALL SECTIONS */
        .notes-section, .terms-section { margin-top: 5px !important; }
        li { margin-bottom: 0px !important; font-size: 9px !important; }
        .total-section { margin-top: 5px !important; }
        h1, h2, h3 { margin: 1px 0 !important; }
        .header-table { margin-bottom: 3px !important; }
        .bill-to-section { margin: 5px 0 !important; padding: 5px !important; }
        .invoice-table th, .invoice-table td { padding: 4px !important; }
    </style>
</head>

@php
    $company = $invoice->lead->company;
    $companyLogo = $company ? $company->logo : \App\Models\Setting::getValue('company_logo');
    $companyName = $company ? $company->name : \App\Models\Setting::getValue('company_name', 'TravelFusion CRM');
    $companyAddress = $company ? $company->address : \App\Models\Setting::getValue('company_address');
    $companyPhone = $company ? $company->phone : \App\Models\Setting::getValue('company_phone');
    $companyEmail = $company ? $company->email : \App\Models\Setting::getValue('company_email');
    $companyDomain = $company ? $company->getFullUrlAttribute() : config('app.url');
    $base64Logo = imageToBase64($companyLogo);

    // Fetch GST settings from the quotation/proposal if possible, or use 0
    $proposals = \App\Models\QueryProposal::where('lead_id', $invoice->lead_id)->get();
    $proposal = $proposals->first(function ($p) use ($invoice) {
        $meta = is_string($p->metadata) ? json_decode($p->metadata, true) : $p->metadata;
        return ($meta['optionNumber'] ?? null) == $invoice->option_number;
    });
    if (!$proposal) {
        $proposal = $proposals->first();
    }
    
    $metadata = $proposal ? (is_string($proposal->metadata) ? json_decode($proposal->metadata, true) : $proposal->metadata) : [];
    
    $gstConfig = $metadata['pricing']['gstSettings'] ?? [];
    $cgstRate = (float)($gstConfig['cgst'] ?? 0);
    $sgstRate = (float)($gstConfig['sgst'] ?? 0);
    $igstRate = (float)($gstConfig['igst'] ?? 0);
    
    $totalAmount = (float) $invoice->total_amount;
    
    $totalTaxRate = $cgstRate + $sgstRate + $igstRate;
    
    if ($totalTaxRate > 0) {
        $baseAmount = $totalAmount / (1 + ($totalTaxRate / 100));
        $cgst = $baseAmount * ($cgstRate / 100);
        $sgst = $baseAmount * ($sgstRate / 100);
        $igst = $baseAmount * ($igstRate / 100);
        $totalTax = $totalAmount - $baseAmount;
    } else {
        $baseAmount = $totalAmount;
        $cgst = 0;
        $sgst = 0;
        $igst = 0;
        $totalTax = 0;
    }

    // Cumulative sum of payments made up to the exact moment this invoice/receipt was generated
    $totalPaid = (float) \App\Modules\Payments\Domain\Entities\Payment::where('lead_id', $invoice->lead_id)
                    ->where('created_at', '<=', $invoice->created_at)
                    ->sum('paid_amount');
    $balanceDue = max(0, $totalAmount - $totalPaid);

    $isReceipt = isset($invoice->metadata['source']) && $invoice->metadata['source'] === 'auto_payment';

    $paxString = ($invoice->lead->adult ?? 0) . ' Adults';
    if ($invoice->lead->child ?? 0)
        $paxString .= ', ' . $invoice->lead->child . ' Child';

    $accountDetailsJson = \App\Models\Setting::getValue('account_details');
    $accountDetails = $accountDetailsJson ? json_decode($accountDetailsJson, true) : null;
@endphp

<body>
    <div class="corner-accent top-left"></div>
    <div class="corner-accent bottom-right"></div>

    <div class="container">
        <table class="header">
            <tr>
                <td>
                    <div class="company-subtitle" style="font-size: 16px; font-weight: bold; color: #000;">{{ $companyName }}</div>
                </td>
                <td class="logo-container">
                    @if($base64Logo)
                        <img src="{{ $base64Logo }}" class="logo-img" alt="Logo">
                    @endif
                    <div class="invoice-info">
                        <div class="info-row">Invoice Number: <strong>{{ $invoice->invoice_number }}</strong></div>
                        <div class="info-row">Due Date:
                            <strong>{{ $invoice->created_at->addDays(7)->format('d-m-Y') }}</strong></div>
                    </div>
                </td>
            </tr>
        </table>

        <div class="bill-to-section">
            <div class="bill-to-title">Bill To: {{ $invoice->lead->company_name ?? $companyName }}</div>
            <div class="bill-to-row"><span class="bill-to-label">Guest Name:</span> {{ $invoice->lead->client_name }}
            </div>
            <div class="bill-to-row"><span class="bill-to-label">Guest Contact:</span> {{ $invoice->lead->phone }}</div>
            <div class="bill-to-row"><span class="bill-to-label">Guest Email:</span> {{ $invoice->lead->email }}</div>
            @if($invoice->lead->gst_number)
                <div class="bill-to-row"><span class="bill-to-label">GSTN:</span> {{ $invoice->lead->gst_number }}</div>
            @endif
        </div>

        <table class="main-table">
            <thead>
                <tr>
                    <th width="40%">Package Name</th>
                    <th width="25%">Travel Dates</th>
                    <th width="15%">Total Pax</th>
                    <th width="20%" style="text-align: right;">Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{{ $invoice->itinerary_name }}</td>
                    <td>
                        @if($invoice->lead->travel_start_date)
                            {{ $invoice->lead->travel_start_date->format('d-m-Y') }}
                        @else
                            TBA
                        @endif
                    </td>
                    <td>{{ $paxString }}</td>
                    <td style="text-align: right;">{{ number_format($baseAmount, 2) }}</td>
                </tr>
            </tbody>
        </table>

        <div class="summary-container">
            <table class="summary-table">
                <tr>
                    <td class="summary-label">TOTAL AMOUNT BEFORE TAX ({{ $invoice->currency ?? 'INR' }}) :</td>
                    <td class="summary-value">{{ number_format($baseAmount, 2) }}</td>
                </tr>
                @if($sgst > 0)
                <tr>
                    <td class="summary-label">SGST {{ $sgstRate }}% :</td>
                    <td class="summary-value">{{ number_format($sgst, 2) }}</td>
                </tr>
                @endif
                @if($cgst > 0)
                <tr>
                    <td class="summary-label">CGST {{ $cgstRate }}% :</td>
                    <td class="summary-value">{{ number_format($cgst, 2) }}</td>
                </tr>
                @endif
                @if($igst > 0)
                <tr>
                    <td class="summary-label">IGST {{ $igstRate }}% :</td>
                    <td class="summary-value">{{ number_format($igst, 2) }}</td>
                </tr>
                @endif
                <tr class="total-row">
                    <td class="summary-label">Total :</td>
                    <td class="summary-value">{{ $invoice->currency ?? 'INR' }} {{ number_format($totalAmount, 2) }}</td>
                </tr>
                @if($isReceipt)
                <tr>
                    <td class="summary-label" style="color: #16a34a;">PAID AMOUNT :</td>
                    <td class="summary-value" style="color: #16a34a;">{{ $invoice->currency ?? 'INR' }} {{ number_format($totalPaid, 2) }}</td>
                </tr>
                <tr>
                    <td class="summary-label" style="color: #dc2626;">BALANCE DUE :</td>
                    <td class="summary-value" style="color: #dc2626;">{{ $invoice->currency ?? 'INR' }} {{ number_format($balanceDue, 2) }}</td>
                </tr>
                @endif
            </table>
        </div>

        <div class="words-section">
            @if($totalTax > 0)
            <div class="words-row"><strong>Total GST value in words:</strong> {{ numberToWords(round($totalTax)) }} Only.</div>
            @endif
            <div class="words-row"><strong>Total Invoice in words:</strong> {{ numberToWords(round($totalAmount)) }} Only.</div>
        </div>

        <div class="terms-section">
            <div class="terms-title">Terms & Conditions</div>
            <ul class="terms-list">
                <li>No Cash Payments Accepted above INR 50,000.</li>
                <li>Guest PAN Card & Company GST Number must require to raise invoice.</li>
                <li>Cheque to the favor of {{ $companyName }}.</li>
                <li>Ensure to signed TCS Declaration form.</li>
                <li>Exchange rate applicable subject to date of invoice.</li>
                <li>Any dispute Subject to the Jurisdiction of local Courts only.</li>
            </ul>
        </div>

        <!-- PAYMENT DETAILS -->
        @if($accountDetails)
        <div class="payment-block">
            <div class="payment-header">OFFICIAL PAYMENT DETAILS</div>
            <table class="bank-info-table">
                <tr>
                    <td class="bank-info-td">
                        <table class="bank-details-subtable">
                            <tr>
                                <td class="label-text">Bank Name</td>
                                <td class="value-text">{{ !empty($accountDetails['bank_name']) ? $accountDetails['bank_name'] : 'N/A' }}</td>
                            </tr>
                            <tr>
                                <td class="label-text">Account Number</td>
                                <td class="value-text" style="font-size: 15px;">{{ !empty($accountDetails['account_number']) ? $accountDetails['account_number'] : 'N/A' }}</td>
                            </tr>
                            <tr>
                                <td class="label-text">IFSC Code</td>
                                <td class="value-text">{{ !empty($accountDetails['ifsc_code']) ? $accountDetails['ifsc_code'] : 'N/A' }}</td>
                            </tr>
                            <tr>
                                <td class="label-text">Account Holder</td>
                                <td class="value-text">{{ !empty($accountDetails['account_holder_name']) ? $accountDetails['account_holder_name'] : 'N/A' }}</td>
                            </tr>
                            <tr>
                                <td class="label-text">UPI ID</td>
                                <td class="value-text" style="color: #d32f2f;">{{ !empty($accountDetails['upi_id']) ? $accountDetails['upi_id'] : 'N/A' }}</td>
                            </tr>
                        </table>
                    </td>
                    @if(!empty($accountDetails['qr_code']))
                    <td class="qr-placeholder">
                        @php $qrBase64 = imageToBase64($accountDetails['qr_code']); @endphp
                        @if($qrBase64)
                            <img src="{{ $qrBase64 }}" class="qr-img-large" alt="Payment QR">
                            <div style="font-size: 11px; font-weight: bold; margin-top: 7px;">SCAN & PAY</div>
                        @endif
                    </td>
                    @endif
                </tr>
            </table>
            <div class="payment-footer">
                PLEASE SHARE A SCREENSHOT OF THE PAYMENT RECEIPT AFTER TRANSFER
            </div>
        </div>
        @endif

        <div class="footer">
            <table class="footer-table">
                <tr>
                    <td class="footer-cell">
                        <div><span class="footer-icon">TEL :</span> {{ $companyPhone }}</div>
                        <div style="margin-top: 3px;"><span class="footer-icon">MAIL :</span> {{ $companyEmail }}</div>
                    </td>
                    <td class="footer-cell" style="text-align: right;">
                        <div><span class="footer-icon">ADD :</span> {{ $companyAddress }}</div>
                        <div style="margin-top: 3px;"><span class="footer-icon">WEB :</span> {{ $companyDomain }}</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>

</html>