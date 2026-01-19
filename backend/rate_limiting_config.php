<?php

// Rate Limiting Configuration for Production

echo "=== Rate Limiting Options ===\n";

// Option 1: Disable Rate Limiting (Not Recommended for Production)
echo "1. Disable Rate Limiting:\n";
echo "   // \\Illuminate\\Routing\\Middleware\\ThrottleRequests::class . ':api',\n\n";

// Option 2: Enable with Higher Limits (Recommended for Production)  
echo "2. Enable with Higher Limits:\n";
echo "   \\Illuminate\\Routing\\Middleware\\ThrottleRequests::class . ':1000,1', // 1000 requests per minute\n\n";

// Option 3: Custom Rate Limiting (Best for Production)
echo "3. Custom Rate Limiting:\n";
echo "   In RouteServiceProvider::boot():\n";
echo "   RateLimiter::for('api', function (Request \$request) {\n";
echo "       return Limit::perMinute(60)->by(\$request->user()?->id ?: \$request->ip());\n";
echo "   });\n";

echo "=== Current Status: DISABLED (for development) ===\n";

?>
