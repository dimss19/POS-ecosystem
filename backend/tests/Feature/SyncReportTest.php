<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Shift;
use App\Models\User;
use Illuminate\Support\Str;

test('device registration and sync push pull flow', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);
    $shift = Shift::create([
        'cashier_id' => $cashier->id,
        'opening_cash' => 50000,
        'opened_at' => now(),
        'status' => 'OPEN',
    ]);

    // 1. Device Registration
    $regResponse = $this->actingAs($cashier)->postJson('/api/devices/register', [
        'device_uuid' => 'DEV-TEST-123',
        'name' => 'Tablet POS',
        'app_version' => '1.0.0',
    ]);
    $regResponse->assertStatus(200);

    $category = Category::create(['name' => 'Beverage']);
    $product = Product::create([
        'name' => 'Iced Tea',
        'category_id' => $category->id,
        'sell_price' => 5000,
        'stock' => 50,
        'unit' => 'glass',
    ]);

    $uuid = (string) Str::uuid();

    // 2. Sync Push
    $pushResponse = $this->actingAs($cashier)->postJson('/api/sync/push', [
        'device_uuid' => 'DEV-TEST-123',
        'transactions' => [
            [
                'uuid' => $uuid,
                'shift_id' => $shift->id,
                'payment_method' => 'CASH',
                'amount_paid' => 5000,
                'items' => [
                    ['product_id' => $product->id, 'quantity' => 1]
                ]
            ]
        ]
    ]);

    $pushResponse->assertStatus(200)
        ->assertJsonPath('data.status', 'SUCCESS')
        ->assertJsonPath('data.success_count', 1);

    // 3. Sync Pull
    $pullResponse = $this->actingAs($cashier)->postJson('/api/sync/pull', [
        'device_uuid' => 'DEV-TEST-123',
        'last_sync_timestamp' => now()->subHour()->toIso8601String(),
    ]);

    $pullResponse->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'server_timestamp',
                'categories',
                'products',
            ]
        ]);
});

test('dashboard and report endpoints return accurate analytics', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $dashboardResponse = $this->actingAs($admin)->getJson('/api/dashboard');
    $dashboardResponse->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'today_sales',
                'today_transactions',
                'low_stock_count',
                'active_shifts',
                'top_products',
            ]
        ]);

    $salesReportResponse = $this->actingAs($admin)->getJson('/api/reports/sales');
    $salesReportResponse->assertStatus(200)
        ->assertJsonStructure([
            'data' => [
                'total_sales',
                'transaction_count',
                'payment_breakdown',
            ]
        ]);
});
