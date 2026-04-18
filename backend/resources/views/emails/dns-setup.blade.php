<!DOCTYPE html>
<html>
<head>
    <title>DNS Setup Instructions</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2765B0;">Hello {{ $company->admin_name ?? 'Admin' }},</h2>
        <p>Congratulations on your new CRM account: <strong>{{ $company->name }}</strong>!</p>
        
        <p>To start using your CRM at <a href="{{ $company->crm_url }}">{{ $company->crm_url }}</a>, you need to add one simple record to your website's DNS settings. It's very easy!</p>
        
        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Step-by-Step Instructions:</h3>
            <ol>
                <li><strong>Log in</strong> to your domain provider (like GoDaddy, Hostinger, or Namecheap).</li>
                <li>Find the <strong>DNS Management</strong> or <strong>DNS Settings</strong> section for your domain.</li>
                <li>Click on <strong>"Add New Record"</strong>.</li>
                <li>Select Type: <strong>A</strong></li>
                <li>In Name (or Host) field, type: <strong>{{ $company->subdomain }}</strong></li>
                <li>In Points to (or Value/IP) field, type: <strong>145.223.23.45</strong></li>
                <li>Keep TTL as Default (usually 300 or 3600) and click <strong>Save</strong>.</li>
            </ol>
        </div>

        <p><strong>Note:</strong> It usually takes 5-10 minutes to start working. After that, you can log in using the credentials we sent you in the other email.</p>
        
        <p>If you face any issues, please reply to this email.</p>
        
        <p>Best Regards,<br>
        Travel Fusion CRM Team</p>
    </div>
</body>
</html>
