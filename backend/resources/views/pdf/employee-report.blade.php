<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Employee Performance Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 20px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            margin: 0;
            color: #333;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            background-color: #f4f4f4;
            padding: 8px;
            border-left: 4px solid #333;
            margin-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            padding: 8px;
            border: 1px solid #ddd;
        }
        .info-item strong {
            display: block;
            color: #333;
            margin-bottom: 3px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        .stat-box {
            text-align: center;
            padding: 15px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
        }
        .stat-box .number {
            font-size: 18px;
            font-weight: bold;
            color: #333;
        }
        .stat-box .label {
            font-size: 10px;
            color: #666;
            margin-top: 5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        table th, table td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        table th {
            background-color: #f4f4f4;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .text-center {
            text-align: center;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            text-align: center;
            color: #666;
            font-size: 10px;
        }
        .positive {
            color: #28a745;
        }
        .negative {
            color: #dc3545;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Employee Performance Report</h1>
        <p><strong>Employee:</strong> {{ $data['employee']['name'] }} ({{ $data['employee']['email'] }})</p>
        <p><strong>Period:</strong> {{ ucfirst($data['period']) }} ({{ $data['date_range']['start_date'] }} to {{ $data['date_range']['end_date'] }})</p>
        <p><strong>Generated on:</strong> {{ date('Y-m-d H:i:s') }}</p>
    </div>

    <div class="section">
        <h2>Performance Summary</h2>
        <div class="stats-grid">
            <div class="stat-box">
                <div class="number">{{ $data['summary']['total_leads'] }}</div>
                <div class="label">Total Leads</div>
            </div>
            <div class="stat-box">
                <div class="number positive">{{ $data['summary']['confirmed_leads'] }}</div>
                <div class="label">Confirmed Leads</div>
            </div>
            <div class="stat-box">
                <div class="number negative">{{ $data['summary']['cancelled_leads'] }}</div>
                <div class="label">Cancelled Leads</div>
            </div>
            <div class="stat-box">
                <div class="number">{{ $data['summary']['success_rate'] }}%</div>
                <div class="label">Success Rate</div>
            </div>
        </div>

        <div class="stats-grid">
            <div class="stat-box">
                <div class="number">₹{{ number_format($data['summary']['total_revenue'], 2) }}</div>
                <div class="label">Total Revenue</div>
            </div>
            <div class="stat-box">
                <div class="number">₹{{ number_format($data['summary']['average_lead_value'], 2) }}</div>
                <div class="label">Avg Lead Value</div>
            </div>
            <div class="stat-box">
                <div class="number">{{ $data['summary']['pending_leads'] }}</div>
                <div class="label">Pending Leads</div>
            </div>
            <div class="stat-box">
                <div class="number">{{ $data['summary']['total_leads'] > 0 ? round(($data['summary']['cancelled_leads'] / $data['summary']['total_leads']) * 100, 2) : 0 }}%</div>
                <div class="label">Cancellation Rate</div>
            </div>
        </div>
    </div>

    @if(!empty($data['daily_breakdown']))
    <div class="section">
        <h2>Daily Performance Breakdown</h2>
        <table>
            <thead>
                <tr>
                    <th>Date</th>
                    <th class="text-right">Total Leads</th>
                    <th class="text-right">Confirmed Leads</th>
                    <th class="text-right">Revenue (₹)</th>
                    <th class="text-right">Success Rate</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['daily_breakdown'] as $day)
                <tr>
                    <td>{{ date('d M Y', strtotime($day->date)) }}</td>
                    <td class="text-right">{{ $day->total_leads }}</td>
                    <td class="text-right">{{ $day->confirmed_leads }}</td>
                    <td class="text-right">₹{{ number_format($day->revenue, 2) }}</td>
                    <td class="text-right">{{ $day->total_leads > 0 ? round(($day->confirmed_leads / $day->total_leads) * 100, 2) : 0 }}%</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    @if(!empty($data['targets']))
    <div class="section">
        <h2>Monthly Targets vs Achievement</h2>
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th class="text-right">Target (₹)</th>
                    <th class="text-right">Achieved (₹)</th>
                    <th class="text-right">Achievement %</th>
                    <th class="text-right">Status</th>
                </tr>
            </thead>
            <tbody>
                @foreach($data['targets'] as $target)
                <tr>
                    <td>{{ date('M Y', strtotime($target['month'] . '-01')) }}</td>
                    <td class="text-right">₹{{ number_format($target['target'], 2) }}</td>
                    <td class="text-right">₹{{ number_format($target['achieved'], 2) }}</td>
                    <td class="text-right">{{ $target['target'] > 0 ? round(($target['achieved'] / $target['target']) * 100, 2) : 0 }}%</td>
                    <td class="text-center">
                        @if($target['target'] > 0)
                            @if($target['achieved'] >= $target['target'])
                                <span class="positive">✓ Achieved</span>
                            @else
                                <span class="negative">✗ Not Achieved</span>
                            @endif
                        @else
                            <span>-</span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <div class="footer">
        <p>This report was automatically generated by the CRM System.</p>
        <p>For any questions or concerns, please contact the system administrator.</p>
    </div>
</body>
</html>
