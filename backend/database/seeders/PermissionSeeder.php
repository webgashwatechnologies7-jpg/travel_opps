<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class PermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create permissions
        $permissions = [
            'manage_company_settings',
            'create_user',
            'edit_user',
            'delete_user',
            'create_branch',
            'edit_branch',
            'delete_branch',
            'view_reports'
        ];

        foreach ($permissions as $permissionName) {
            Permission::create([
                'name' => $permissionName,
                'guard_name' => 'web'
            ]);
        }

        // Assign manage_company_settings permission to Admin role
        $adminRole = Role::where('name', 'Admin')->first();
        if ($adminRole) {
            $adminRole->givePermissionTo('manage_company_settings');
            $this->command->info('manage_company_settings permission granted to Admin role');
        } else {
            $this->command->warn('Admin role not found, creating it...');
            $adminRole = Role::create([
                'name' => 'Admin',
                'guard_name' => 'web'
            ]);
            $adminRole->givePermissionTo('manage_company_settings');
            $this->command->info('Admin role created and manage_company_settings permission granted');
        }

        $this->command->info('Permissions seeded successfully');
    }
}
