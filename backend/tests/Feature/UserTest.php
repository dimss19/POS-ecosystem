<?php

use App\Models\User;

test('admin can list users', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    User::factory()->count(3)->create(['role' => 'cashier']);

    $response = $this->actingAs($admin)
        ->getJson('/api/users');

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data',
            'meta' => ['current_page', 'total'],
        ]);
});

test('cashier cannot list users', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);

    $response = $this->actingAs($cashier)
        ->getJson('/api/users');

    $response->assertStatus(403);
});

test('admin can create cashier account', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $response = $this->actingAs($admin)
        ->postJson('/api/users', [
            'name' => 'New Cashier',
            'email' => 'cashier1@pos.com',
            'password' => 'secret123',
            'role' => 'cashier',
            'is_active' => true,
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.name', 'New Cashier')
        ->assertJsonPath('data.role', 'cashier');

    $this->assertDatabaseHas('users', [
        'email' => 'cashier1@pos.com',
        'role' => 'cashier',
    ]);
});

test('admin can deactivate user', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $cashier = User::factory()->create(['role' => 'cashier', 'is_active' => true]);

    $response = $this->actingAs($admin)
        ->deleteJson("/api/users/{$cashier->id}");

    $response->assertStatus(200);

    $this->assertDatabaseHas('users', [
        'id' => $cashier->id,
        'is_active' => false,
    ]);
});
