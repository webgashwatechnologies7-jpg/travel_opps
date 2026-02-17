<x-mail::message>
    # Congratulations! You are LIVE! 🚀

    Hi **{{ $company->name }}**,

    Great news! We have successfully verified your DNS settings. Your custom domain **{{ $company->domain }}** is now
    active and linked to your CRM.

    ### Access Your Dashboard
    You can now access your CRM directly from your branded domain:

    <x-mail::button :url="$loginUrl">
        Login to CRM
    </x-mail::button>

    Or visit: [{{ $loginUrl }}]({{ $loginUrl }})

    We are excited to have you on board! If you face any issues, our support team is here to help.

    Cheers,<br>
    {{ config('app.name') }} Team
</x-mail::message>