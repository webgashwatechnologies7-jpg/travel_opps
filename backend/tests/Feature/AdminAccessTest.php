<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AdminAccessTest extends TestCase
{
    use RefreshDatabase;

    private function ensureAdminRole(): Role
    {
        return Role::firstOrCreate([
            'name' => 'Admin',
            'guard_name' => 'web',
        ]);
    }

    public function test_non_admin_user_cannot_access_admin_routes(): void
    {
        $user = User::factory()->create();

        Sanctum::actingAs($user);

        $this->getJson('/api/admin/users')
            ->assertStatus(403);
    }

    public function test_admin_user_can_access_admin_routes(): void
    {
        $user = User::factory()->create();
        $this->ensureAdminRole();
        $user->assignRole('Admin');

        Sanctum::actingAs($user);

        $this->getJson('/api/admin/users')
            ->assertStatus(200)
            ->assertJson([
                'success' => true,
            ]);
    }
}
