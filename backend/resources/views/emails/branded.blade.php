<!DOCTYPE html>
<html>

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject }}</title>
</head>

<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px 0;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                    style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <tr>
                        <td
                            style="background: linear-gradient(135deg, #2563eb, #3b82f6); padding: 30px 40px; text-align: center;">
                            @if($logo)
                                <img src="{{ $logo }}" alt="{{ $name }}" style="max-height: 60px; margin-bottom: 10px;">
                            @endif
                            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">{{ $name }}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 40px;">
                            <div style="color: #333333; font-size: 15px; line-height: 1.6;">
                                {!! nl2br(e($body)) !!}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f8fafc; padding: 30px 40px; border-top: 1px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td style="color: #6b7280; font-size: 13px;">
                                        <p style="margin: 0 0 10px 0;"><strong>{{ $name }}</strong></p>
                                        @if($phone)
                                        <p style="margin: 0 0 5px 0;">📞 {{ $phone }}</p> @endif
                                        @if($email)
                                        <p style="margin: 0 0 5px 0;">✉️ {{ $email }}</p> @endif
                                        @if($address)
                                        <p style="margin: 0;">📍 {{ $address }}</p> @endif
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>

</html>