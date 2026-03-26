<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Modules\Leads\Presentation\Controllers\LeadsController;
use Illuminate\Http\Request;

$request = Request::create('/api/leads', 'GET', ['per_page' => 8]);
$user = App\Models\User::first();
$request->setUserResolver(function () use ($user) { return $user; });

$controller = $app->make(LeadsController::class);
$response = $controller->index($request);

$data = json_decode($response->getContent(), true);
$lead = $data['data']['leads'][0];
echo "Assigned Name: " . ($lead['assigned_name'] ?? 'MISSING') . "\n";
echo "Assigned User: " . (isset($lead['assigned_user']) ? 'PRESENT' : 'MISSING') . "\n";
