<?php

// Simple debug script for Hostinger
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>TravelOps CRM - Hostinger Debug</h1>";

// Test 1: Basic PHP
echo "<h2>✅ PHP Test: " . phpversion() . "</h2>";

// Test 2: Laravel Bootstrap
echo "<h2>🔧 Laravel Bootstrap Test</h2>";
try {
    require_once __DIR__.'/vendor/autoload.php';
    echo "✅ Autoload loaded<br>";
    
    $app = require_once __DIR__.'/bootstrap/app.php';
    echo "✅ App loaded<br>";
    
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();
    echo "✅ Kernel bootstrapped<br>";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "<br>";
    echo "File: " . $e->getFile() . " Line: " . $e->getLine() . "<br>";
}

// Test 3: Database Connection
echo "<h2>🗄️ Database Test</h2>";
try {
    $pdo = new PDO(
        "mysql:host=" . env('DB_HOST', 'localhost') . ";dbname=" . env('DB_DATABASE'),
        env('DB_USERNAME'),
        env('DB_PASSWORD')
    );
    echo "✅ Database connected<br>";
    
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM users");
    $result = $stmt->fetch();
    echo "✅ Users found: " . $result['count'] . "<br>";
    
} catch (Exception $e) {
    echo "❌ Database Error: " . $e->getMessage() . "<br>";
}

// Test 4: API Route Test
echo "<h2>🌐 API Route Test</h2>";
echo "<a href='/api/test-unique' target='_blank'>Test API Endpoint</a><br>";

// Test 5: Environment Variables
echo "<h2>🔧 Environment Variables</h2>";
echo "APP_ENV: " . env('APP_ENV', 'Not Set') . "<br>";
echo "APP_DEBUG: " . (env('APP_DEBUG') ? 'true' : 'false') . "<br>";
echo "DB_HOST: " . env('DB_HOST', 'Not Set') . "<br>";
echo "DB_DATABASE: " . env('DB_DATABASE', 'Not Set') . "<br>";

echo "<h2>📝 Next Steps</h2>";
echo "<ol>";
echo "<li>Upload this file to Hostinger</li>";
echo "<li>Access: your-domain.com/debug_hostinger.php</li>";
echo "<li>Check all tests pass</li>";
echo "<li>Update .env file if needed</li>";
echo "<li>Run: php artisan migrate --force</li>";
echo "<li>Delete this debug file</li>";
echo "</ol>";

?>
