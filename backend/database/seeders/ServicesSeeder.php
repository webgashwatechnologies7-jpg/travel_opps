<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Service;
use App\Models\Company;

class ServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get all companies or use a default company
        $companies = Company::all();
        
        if ($companies->isEmpty()) {
            // Create a default company if none exists
            $company = Company::create([
                'name' => 'Default Company',
                'email' => 'default@example.com',
                'status' => 'active'
            ]);
        } else {
            $company = $companies->first();
        }

        $defaultServices = [
            ['name' => 'Full Package', 'description' => 'Complete travel package with all services'],
            ['name' => 'Hotel Only', 'description' => 'Accommodation only service'],
            ['name' => 'Visa Only', 'description' => 'Visa processing service'],
            ['name' => 'Flight Only', 'description' => 'Flight booking service']
        ];

        foreach ($defaultServices as $serviceData) {
            Service::firstOrCreate([
                'name' => $serviceData['name'],
                'company_id' => $company->id
            ], [
                'description' => $serviceData['description'],
                'status' => 'active'
            ]);
        }
    }
}
