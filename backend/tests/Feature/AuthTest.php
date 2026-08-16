<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('user can login with valid credentials', function () {
    $user = User::factory()->create([
        'email' => 'testuser@pos.com',
        'password' => Hash::make('password123'),
        'is_active' => true,
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'testuser@pos.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'user' => ['id', 'email', 'name', 'role'],
                'token',
            ],
            'message',
        ]);
});

test('user login fails with invalid credentials', function () {
    $user = User::factory()->create([
        'email' => 'testfail@pos.com',
        'password' => Hash::make('password123'),
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'testfail@pos.com',
        'password' => 'wrongpassword',
    ]);

    $response->assertStatus(401);
});

test('inactive user cannot login', function () {
    $user = User::factory()->create([
        'email' => 'inactive@pos.com',
        'password' => Hash::make('password123'),
        'is_active' => false,
    ]);

    $response = $this->postJson('/api/auth/login', [
        'email' => 'inactive@pos.com',
        'password' => 'password123',
    ]);

    $response->assertStatus(403);
});

test('authenticated user can access me and logout', function () {
    $user = User::factory()->create();
    $token = $user->createToken('test-token')->plainTextToken;

    $meResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->getJson('/api/auth/me');

    $meResponse->assertStatus(200)
        ->assertJsonPath('data.email', $user->email);

    $logoutResponse = $this->withHeader('Authorization', "Bearer {$token}")
        ->postJson('/api/auth/logout');

    $logoutResponse->assertStatus(200);
});
