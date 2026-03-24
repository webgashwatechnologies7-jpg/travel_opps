<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject }}</title>
</head>

<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f0f2f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f2f5; padding: 40px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" 
                    style="background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e1e4e8; border-bottom: 3px solid #10b981;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 30px 40px; border-bottom: 1px solid #f1f5f9;">
                            @if($logo)
                                <img src="{{ $logo }}" alt="{{ $name }}" style="max-height: 80px; width: auto; display: block; margin-bottom: 10px;">
                            @else
                                <h1 style="color: #1a1a1a; margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.5px;">{{ $name }}</h1>
                            @endif
                        </td>
                    </tr>
                    
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 50px;">
                            <div style="color: #334155; font-size: 16px; line-height: 1.7; font-weight: 400;">
                                {!! nl2br(e($body)) !!}
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer / Branding -->
                    <tr>
                        <td style="background-color: #f8fafc; padding: 35px 50px; border-top: 1px solid #f1f5f9;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="color: #475569; font-size: 14px; line-height: 1.6;">
                                        <p style="margin: 0 0 12px 0; color: #0f172a; font-weight: 700; font-size: 16px;">
                                            {{ $name }}
                                        </p>
                                        
                                        @if($phone)
                                        <p style="margin: 4px 0; display: table;">
                                            <span style="display: table-cell; width: 24px; color: #10b981;">📞</span> 
                                            <span style="display: table-cell;">{{ $phone }}</span>
                                        </p>
                                        @endif
                                        
                                        @if($email)
                                        <p style="margin: 4px 0; display: table;">
                                            <span style="display: table-cell; width: 24px; color: #10b981;">✉️</span>
                                            <span style="display: table-cell; color: #2563eb; text-decoration: none;">{{ $email }}</span>
                                        </p>
                                        @endif
                                        
                                        @if($address)
                                        <p style="margin: 4px 0; display: table;">
                                            <span style="display: table-cell; width: 24px; color: #10b981;">📍</span>
                                            <span style="display: table-cell;">{{ $address }}</span>
                                        </p>
                                        @endif
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-top: 25px; border-top: 1px solid #e2e8f0; margin-top: 25px; font-size: 12px; color: #94a3b8; text-align: center;">
                                        &copy; {{ date('Y') }} {{ $name }}. All rights reserved.
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                <p style="margin-top: 20px; color: #94a3b8; font-size: 11px; text-align: center;">
                    Powered by TravelOps CRM
                </p>
            </td>
        </tr>
    </table>
</body>

</html>