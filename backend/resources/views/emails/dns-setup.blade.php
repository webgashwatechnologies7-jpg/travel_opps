<!DOCTYPE html>
<html>
<head>
    <title>DNS Setup Instructions</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2765B0;">Hello {{ $company->admin_name ?? 'Admin' }},</h2>
        <p>Congratulations on your new CRM account: <strong>{{ $company->name }}</strong>!</p>
        
        <div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <strong>IMPORTANT:</strong> Please complete the DNS setup below FIRST. You will be able to log in <strong>1 to 5 minutes</strong> after adding the record.
        </div>

        <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Step-by-Step Instructions:</h3>
            <ol>
                <li><strong>Log in</strong> to your domain provider (like GoDaddy, Hostinger, or Namecheap) where you bought <strong>{{ $company->domain }}</strong>.</li>
                <li>Find the <strong>DNS Management</strong> or <strong>DNS Settings</strong> section for your domain.</li>
                <li>Click on <strong>"Add New Record"</strong>.</li>
                <li>Select Type: <strong>A</strong></li>
                <li>In Name (or Host) field, type: <strong>crm</strong></li>
                <li>In Points to (or Value/IP) field, type: <strong>145.223.23.45</strong></li>
                <li>Keep TTL as Default (usually 300) and click <strong>Save</strong>.</li>
            </ol>
        </div>

        <p><strong>Note:</strong> Once you save the record, please wait for <strong>1 to 5 minutes</strong>. After that, you can log in using the credentials we sent you in the other email.</p>
        
        <p>If you face any issues, please reply to this email.</p>
        
        <p>Best Regards,<br>
        CRM Team</p>
    </div>
</body>
</html>
