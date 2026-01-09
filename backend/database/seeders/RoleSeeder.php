<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default roles
        $roles = [
            'Admin',
            'Sales',
            'Operations',
            'Finance',
            'HR',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(
                ['name' => $roleName, 'guard_name' => 'web'],
                ['name' => $roleName, 'guard_name' => 'web']
            );
            $this->command->info("Role '{$roleName}' created or already exists.");
        }

        // Assign Admin role to the first user (if exists)
        try {
            $firstUser = User::first();
            if ($firstUser) {
                $adminRole = Role::where('name', 'Admin')->first();
                if ($adminRole && !$firstUser->hasRole('Admin')) {
                    $firstUser->assignRole('Admin');
                    $this->command->info("Admin role assigned to user: {$firstUser->email}");
                } elseif ($firstUser->hasRole('Admin')) {
                    $this->command->info("User {$firstUser->email} already has Admin role.");
                } else {
                    $this->command->warn("Admin role not found.");
                }
            } else {
                $this->command->info("No users found in database. Admin role will be assigned when the first user is created.");
            }
        } catch (\Exception $e) {
            $this->command->warn("Could not assign Admin role: " . $e->getMessage());
            $this->command->info("You can manually assign the Admin role to a user after creating one.");
        }
    }
}

