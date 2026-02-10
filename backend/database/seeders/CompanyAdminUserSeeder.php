<?php

namespace Database\Seeders;

use App\Models\Company;
use App\Models\User;
use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class CompanyAdminUserSeeder extends Seeder
{
    /**
     * Seed company admin user for login.
     * Email: pankaglocal@yopmail.com
     * Password: pankaj@123
     */
    public function run(): void
    {
        $email = 'pankaglocal@yopmail.com';
        $password = 'pankaj@123';
        $name = 'Pankaj (Company Admin)';

        // Ensure Company Admin role exists
        $companyAdminRole = Role::firstOrCreate(
            ['name' => 'Company Admin', 'guard_name' => 'web'],
            ['name' => 'Company Admin', 'guard_name' => 'web']
        );

        // Get or create company so user can login from company domain (e.g. gashwa.localhost)
        $company = Company::where('domain', 'gashwa.localhost')
            ->orWhere('subdomain', 'gashwa')
            ->first();

        if (!$company) {
            $plan = SubscriptionPlan::first();
            $company = Company::create([
                'name' => 'Gashwa Technologies',
                'subdomain' => 'gashwa',
                'domain' => 'gashwa.localhost',
                'email' => $email,
                'status' => 'active',
                'subscription_plan_id' => $plan?->id,
                'subscription_start_date' => now(),
                'subscription_end_date' => now()->addYear(),
            ]);
            $this->command->info('Company created: ' . $company->name . ' (domain: gashwa.localhost)');
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            $user->update([
                'password' => Hash::make($password),
                'name' => $name,
                'company_id' => $company->id,
                'is_active' => true,
                'is_super_admin' => false,
            ]);
            if (!$user->hasRole('Company Admin')) {
                $user->assignRole($companyAdminRole);
            }
            $this->command->info('User updated: ' . $email);
        } else {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'company_id' => $company->id,
                'is_super_admin' => false,
                'is_active' => true,
            ]);
            $user->assignRole($companyAdminRole);
            $this->command->info('User created: ' . $email);
        }

        $this->command->info('Login URL (local): http://gashwa.localhost:3000/login');
        $this->command->info('Email: ' . $email);
        $this->command->info('Password: ' . $password);
    }
}
