<?php
App\Models\Company::whereNull('api_key')->get()->each(function ($company) {
    $company->api_key = 'sk_test_' . \Illuminate\Support\Str::random(32);
    $company->save();
});
echo "Done!";
