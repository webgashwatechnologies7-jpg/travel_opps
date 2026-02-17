<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to the "home" route for your application.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        $this->configureRateLimiting();

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            // Storage route without middleware (no session required)
            Route::get('/storage/{folder}/{filename}', function ($folder, $filename) {
                $path = $folder . '/' . $filename;

                if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
                    abort(404);
                }

                $file = \Illuminate\Support\Facades\Storage::disk('public')->get($path);
                $type = \Illuminate\Support\Facades\Storage::disk('public')->mimeType($path);

                return \Illuminate\Support\Facades\Response::make($file, 200, [
                    'Content-Type' => $type,
                    'Content-Disposition' => 'inline; filename="' . $filename . '"',
                ]);
            })->where(['folder' => '[a-zA-Z0-9_-]+', 'filename' => '[a-zA-Z0-9._-]+']);

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }

    /**
     * Configure the rate limiters for the application.
     */
    protected function configureRateLimiting(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(1000)->by($request->user()?->id ?: $request->ip());
        });
    }
}
