<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TravelOps CRM Login Details</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
        <h1 style="color: #2563eb; margin: 0;">TravelOps CRM</h1>
    </div>
    
    <div style="background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 5px;">
        <h2 style="color: #1f2937; margin-top: 0;">Your Account Has Been Created</h2>
        
        @if($companyName)
        <p>Your TravelOps CRM account for <strong>{{ $companyName }}</strong> has been created successfully.</p>
        @else
        <p>Your TravelOps CRM account has been created successfully.</p>
        @endif
        
        <p>Below are your login credentials:</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Login URL:</strong> {{ $crmUrl }}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> {{ $email }}</p>
            <p style="margin: 5px 0;"><strong>Password:</strong> {{ $password }}</p>
        </div>
        
        <p><strong>Important:</strong> Please change your password after your first login for security purposes.</p>
        
        <p style="margin-top: 30px;">
            <a href="{{ $crmUrl }}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Login to Your CRM Dashboard</a>
        </p>
        
        <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
            If you have any questions, please contact the administrator.
        </p>
    </div>
    
    <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
        <p>© {{ date('Y') }} TravelOps. All rights reserved.</p>
    </div>
</body>
</html>

