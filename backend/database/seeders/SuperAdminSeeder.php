<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create super admin user
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@travelops.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password123'),
                'is_active' => true,
                'is_super_admin' => true,
                'company_id' => null, // Super admin doesn't belong to any company
            ]
        );

        $this->command->info('Super Admin created:');
        $this->command->info('Email: admin@travelops.com');
        $this->command->info('Password: password123');
        $this->command->warn('Please change the password after first login!');
    }
}

