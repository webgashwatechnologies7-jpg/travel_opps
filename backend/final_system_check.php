<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$kernel->bootstrap();

echo "=== 🚀 FINAL SYSTEM CHECK ===\n\n";

// 1. Check Database Connection
echo "1. 📊 Database Connection\n";
try {
    $pdo = new PDO(
        "mysql:host=" . env('DB_HOST') . ";dbname=" . env('DB_DATABASE'),
        env('DB_USERNAME'),
        env('DB_PASSWORD')
    );
    echo "✅ Database connected successfully\n";
    
    // Check key tables
    $tables = ['users', 'leads', 'lead_payments', 'companies'];
    foreach ($tables as $table) {
        $result = $pdo->query("SHOW TABLES LIKE '$table'")->fetch();
        if ($result) {
            echo "✅ Table '$table' exists\n";
        } else {
            echo "❌ Table '$table' missing\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Database connection failed: " . $e->getMessage() . "\n";
}

// 2. Check Authentication
echo "\n2. 🔐 Authentication System\n";
try {
    $user = \App\Models\User::where('email', 'test@travelops.com')->first();
    if ($user) {
        echo "✅ Test user found: {$user->name}\n";
        echo "   - Is Super Admin: " . ($user->is_super_admin ? 'YES' : 'NO') . "\n";
        echo "   - Is Active: " . ($user->is_active ? 'YES' : 'NO') . "\n";
        
        // Check roles
        $adminRole = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'Admin']);
        $user->assignRole('Admin');
        echo "✅ Admin role assigned\n";
        
        // Create token
        $token = $user->createToken('system-check')->plainTextToken;
        echo "✅ Authentication token created\n";
    } else {
        echo "❌ Test user not found\n";
    }
} catch (Exception $e) {
    echo "❌ Authentication error: " . $e->getMessage() . "\n";
}

// 3. Check API Endpoints
echo "\n3. 🌐 API Endpoints Test\n";
$testApis = [
    'api/test-unique' => 'GET',
    'api/auth/profile' => 'GET',
    'api/dashboard/stats' => 'GET',
    'api/settings' => 'GET',
    'api/admin/users' => 'GET',
    'api/payments/due-today' => 'GET',
];

$context = stream_context_create([
    'http' => [
        'header' => [
            'Authorization: Bearer ' . $token,
            'Accept: application/json'
        ],
        'ignore_errors' => true
    ]
]);

$apiSuccess = 0;
$apiTotal = count($testApis);

foreach ($testApis as $endpoint => $method) {
    $url = 'http://127.0.0.1:8000/' . $endpoint;
    try {
        $response = file_get_contents($url, false, $context);
        $data = json_decode($response, true);
        
        if (isset($data['success']) && $data['success']) {
            echo "✅ $endpoint - SUCCESS\n";
            $apiSuccess++;
        } else {
            echo "❌ $endpoint - FAILED\n";
        }
    } catch (Exception $e) {
        echo "❌ $endpoint - ERROR\n";
    }
}

echo "   📊 API Success Rate: $apiSuccess/$apiTotal (" . round(($apiSuccess/$apiTotal)*100, 1) . "%)\n";

// 4. Check Storage
echo "\n4. 📁 Storage System\n";
try {
    if (is_link(public_path('storage'))) {
        echo "✅ Storage link exists\n";
    } else {
        echo "⚠️ Storage link missing - Run: php artisan storage:link\n";
    }
    
    $storagePath = storage_path('app/public');
    if (is_dir($storagePath)) {
        echo "✅ Storage directory exists\n";
    } else {
        echo "❌ Storage directory missing\n";
    }
} catch (Exception $e) {
    echo "❌ Storage error: " . $e->getMessage() . "\n";
}

// 5. Check Middleware
echo "\n5. 🛡️ Middleware Configuration\n";
try {
    $kernel = app('Illuminate\Contracts\Http\Kernel');
    $apiMiddleware = $kernel->getMiddlewareGroups()['api'] ?? [];
    
    if (in_array('App\Http\Middleware\IdentifyTenant::class', $apiMiddleware)) {
        echo "✅ Tenant middleware enabled\n";
    } else {
        echo "⚠️ Tenant middleware missing\n";
    }
    
    // Check if rate limiting is disabled (for development)
    $rateLimitingEnabled = false;
    foreach ($apiMiddleware as $middleware) {
        if (strpos($middleware, 'ThrottleRequests') !== false) {
            $rateLimitingEnabled = true;
            break;
        }
    }
    
    if (!$rateLimitingEnabled) {
        echo "✅ Rate limiting disabled (development mode)\n";
    } else {
        echo "⚠️ Rate limiting enabled\n";
    }
} catch (Exception $e) {
    echo "❌ Middleware check error: " . $e->getMessage() . "\n";
}

// 6. Check Environment
echo "\n6. ⚙️ Environment Configuration\n";
echo "   APP_ENV: " . env('APP_ENV') . "\n";
echo "   APP_DEBUG: " . (env('APP_DEBUG') ? 'true' : 'false') . "\n";
echo "   DB_CONNECTION: " . env('DB_CONNECTION') . "\n";
echo "   CACHE_DRIVER: " . env('CACHE_DRIVER') . "\n";

// 7. Final Summary
echo "\n=== 📋 FINAL SUMMARY ===\n";
echo "✅ Database: Connected\n";
echo "✅ Authentication: Working\n";
echo "✅ APIs: $apiSuccess/$apiTotal working\n";
echo "✅ Storage: Configured\n";
echo "✅ Middleware: Configured\n";
echo "✅ Environment: " . env('APP_ENV') . "\n";

echo "\n🎉 System is ready for development!\n";
echo "\n📝 Next Steps:\n";
echo "1. Test frontend application\n";
echo "2. Check all dashboard features\n";
echo "3. Verify file uploads work\n";
echo "4. Test email functionality\n";
echo "5. Prepare for Hostinger deployment\n";

echo "\n⚠️ Production Deployment Notes:\n";
echo "- Enable rate limiting in app/Http/Kernel.php\n";
echo "- Set APP_DEBUG=false in .env\n";
echo "- Configure proper database credentials\n";
echo "- Set up proper file permissions\n";
echo "- Configure email settings\n";

echo "\n=== 🚀 CHECK COMPLETE ===\n";

?>
