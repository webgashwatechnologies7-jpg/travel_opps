<x-mail::message>
    # Welcome to {{ config('app.name') }}!

    Hi **{{ $company->name }}**,

    Thank you for subscribing to **{{ config('app.name') }}**. We have successfully created your account.

    ### Step 1: Temporary Login Details
    You can login to your dashboard using the following credentials:
    - **URL:** [{{ $company->crm_url }}]({{ $company->crm_url }})
    - **Email:** {{ $company->email }}
    - **Password:** {{ $password }}

    ### Step 2: Setup Your Custom Domain
    To make your CRM live on **{{ $company->domain ?? 'your custom domain' }}**, you need to configure your DNS
    settings:

    1. Log in to your Domain Registrar (GoDaddy, Namecheap, etc.).
    2. Go to DNS Management.
    3. Add an **A Record** pointing to our server IP:
    > **{{ $serverIp }}**

    Once you have updated the DNS, please notify us so we can verify and activate your domain.

    <x-mail::button :url="$dnsInstructionsLink">
        Read Setup Guide
    </x-mail::button>

    Thanks,<br>
    {{ config('app.name') }} Team
</x-mail::message>