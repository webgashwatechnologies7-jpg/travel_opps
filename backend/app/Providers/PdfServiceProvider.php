<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class PdfServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        // Configure DOMPDF
        if (class_exists('DomPDF\PDF')) {
            $options = new \Dompdf\Options();
            $options->set('defaultFont', 'Arial');
            $options->set('isRemoteEnabled', true);
            $options->set('isHtml5ParserEnabled', true);
            $options->set('isPhpEnabled', true);
            
            \DomPDF::setOptions($options);
        }
    }
}
