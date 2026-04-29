<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f3f4f6; color: #1e293b; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #f3f4f6; padding: 40px 0; }
        .container { width: 650px; background-color: #ffffff; margin: 0 auto; border-radius: 4px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); overflow: hidden; }
        .header { padding: 30px 40px; border-bottom: 2px solid #f1f5f9; position: relative; }
        .header-top { display: block; width: 100%; margin-bottom: 20px; }
        .logo-img { max-height: 75px; width: auto; }
        .header-title { font-size: 20px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; text-align: right; }
        .content { padding: 40px; min-height: 200px; line-height: 1.8; font-size: 16px; color: #334155; }
        .footer { background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e2e8f0; }
        .contact-info { width: 100%; font-size: 14px; color: #64748b; }
        .contact-info b { color: #0f172a; display: block; margin-bottom: 8px; font-size: 16px; }
        .divider { height: 4px; background: linear-gradient(to right, #10b981, #3b82f6); width: 100%; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="container">
            <div class="divider"></div>
            <!-- Header -->
            <table class="header" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td align="left" width="50%">
                        @if($logo)
                            <img src="{{ $logo }}" alt="{{ $name }}" class="logo-img">
                        @else
                            <h2 style="margin:0; color:#0f172a;">{{ $name }}</h2>
                        @endif
                    </td>
                    <td align="right" width="50%">
                        <div style="font-size: 13px; color: #94a3b8; margin-bottom: 4px;">{{ date('d-m-Y') }}</div>
                        <div class="header-title">{{ $subject }}</div>
                    </td>
                </tr>
            </table>

            <!-- Body Contents -->
            <table class="content" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td>
                        <div style="margin-bottom: 20px; color:#64748b; font-size: 14px;">Message Details:</div>
                        {!! nl2br(e($body)) !!}
                    </td>
                </tr>
            </table>

            <!-- Professional Footer -->
            <table class="footer" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    <td>
                        <table class="contact-info" width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td width="60%">
                                    <b>{{ $name }}</b>
                                    @if($address)
                                        <div style="margin-bottom: 4px;">📍 {{ $address }}</div>
                                    @endif
                                    @if($phone)
                                        <div style="margin-bottom: 4px;">📞 {{ $phone }}</div>
                                    @endif
                                </td>
                                <td width="40%" align="right" valign="top">
                                    @if($email)
                                        <div style="margin-bottom: 4px;">✉️ {{ $email }}</div>
                                    @endif
                                    <div style="font-size: 12px; margin-top: 15px; color: #cbd5e1;">Sent via CRM</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>
        <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 25px;">
            This is an automated communication from {{ $name }}.
        </p>
    </div>
</body>
</html>