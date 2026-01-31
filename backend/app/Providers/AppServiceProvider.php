<?php

namespace App\Providers;

use App\Modules\Leads\Domain\Interfaces\LeadRepositoryInterface;
use App\Modules\Leads\Infrastructure\Repositories\LeadRepository;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Ensure 'tenant' is always bound (avoids "Target class [tenant] does not exist" on live when accessed by IP)
        $this->app->instance('tenant', null);

        // Bind repository interfaces to implementations
        $this->app->bind(
            LeadRepositoryInterface::class,
            LeadRepository::class
        );
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Fix for MySQL key length issue with utf8mb4
        Schema::defaultStringLength(191);
    }
}
