<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AddStatusPermissionsSeeder extends Seeder
{
    public function run()
    {
        $permissions = [
            'suppliers.status',
            'activities.status',
            'destinations.status',
            'day_itineraries.status',
            // Add hotel and transfer status just in case we add them later, good practice
            'hotels.status',
            'transfers.status'
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => 'web']);
            $this->command->info("Permission created: $permissionName");
        }

        // Assign to Admin role
        $adminRole = Role::where('name', 'Admin')->first();
        if ($adminRole) {
            $adminRole->givePermissionTo($permissions);
            $this->command->info("Permissions assigned to Admin role");
        }

        // Assign to Super Admin (if exists via role, usually they have implicit access but let's be safe)
        $superAdminRole = Role::where('name', 'Super Admin')->first();
        if ($superAdminRole) {
            $superAdminRole->givePermissionTo($permissions);
            $this->command->info("Permissions assigned to Super Admin role");
        }
    }
}
