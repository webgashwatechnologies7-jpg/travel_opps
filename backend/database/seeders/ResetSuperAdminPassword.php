<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ResetSuperAdminPassword extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $user = User::where('email', 'admin@travelops.com')->first();
        
        if ($user) {
            $user->password = Hash::make('password123');
            $user->is_active = true;
            $user->is_super_admin = true;
            $user->company_id = null;
            $user->save();
            
            $this->command->info('✅ Super Admin password reset successfully!');
            $this->command->info('Email: admin@travelops.com');
            $this->command->info('Password: password123');
        } else {
            $this->command->error('❌ Super Admin user not found!');
            $this->command->info('Creating new super admin...');
            
            User::create([
                'name' => 'Super Admin',
                'email' => 'admin@travelops.com',
                'password' => Hash::make('password123'),
                'is_active' => true,
                'is_super_admin' => true,
                'company_id' => null,
            ]);
            
            $this->command->info('✅ Super Admin created successfully!');
        }
    }
}

