<?php
$request = new \Illuminate\Http\Request();
$request->merge([
    'api_key' => \App\Models\Company::first()->api_key,
    'name' => 'Web-To-Lead API',
    'phone' => '9854454544',
    'destination' => 'shimla',
    'email' => 'web@yopmail.com',
    'source' => 'Instagram',
    'campaign_name' => 'campaign_name',
    'remark' => 'remark data'
]);

try {
    $controller = app()->make(\App\Http\Controllers\WebToLeadController::class);
    $response = $controller->store($request);
    echo "Response: " . $response->getContent() . "\n";
} catch (\Exception $e) {
    echo "Exception: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . " on line " . $e->getLine() . "\n";
}
