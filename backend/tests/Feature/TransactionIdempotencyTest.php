<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Support\Str;

test('cashier can create transaction with stock deduction and snapshots', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);
    $shift = Shift::create([
        'cashier_id' => $cashier->id,
        'opening_cash' => 50000,
        'opened_at' => now(),
        'status' => 'OPEN',
    ]);

    $category = Category::create(['name' => 'Food']);
    $product = Product::create([
        'sku' => 'SKU-001',
        'barcode' => 'BC-001',
        'name' => 'Instant Noodle',
        'category_id' => $category->id,
        'sell_price' => 3000,
        'stock' => 50,
        'unit' => 'pack',
    ]);

    $uuid = (string) Str::uuid();

    $response = $this->actingAs($cashier)
        ->postJson('/api/transactions', [
            'uuid' => $uuid,
            'shift_id' => $shift->id,
            'payment_method' => 'CASH',
            'amount_paid' => 10000,
            'items' => [
                [
                    'product_id' => $product->id,
                    'quantity' => 2,
                ]
            ]
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('data.uuid', $uuid)
        ->assertJsonPath('data.total', "6000.00")
        ->assertJsonPath('data.change_amount', "4000.00");

    // Verify stock reduced from 50 to 48
    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'stock' => 48,
    ]);

    // Verify snapshots stored
    $this->assertDatabaseHas('transaction_items', [
        'product_id' => $product->id,
        'product_name_snapshot' => 'Instant Noodle',
        'sku_snapshot' => 'SKU-001',
        'quantity' => 2,
    ]);
});

test('idempotency: sending identical transaction UUID twice returns existing record without duplicating', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);
    $shift = Shift::create([
        'cashier_id' => $cashier->id,
        'opening_cash' => 50000,
        'opened_at' => now(),
        'status' => 'OPEN',
    ]);

    $category = Category::create(['name' => 'Drink']);
    $product = Product::create([
        'name' => 'Mineral Water',
        'category_id' => $category->id,
        'sell_price' => 5000,
        'stock' => 20,
        'unit' => 'bottle',
    ]);

    $uuid = (string) Str::uuid();
    $payload = [
        'uuid' => $uuid,
        'shift_id' => $shift->id,
        'payment_method' => 'CASH',
        'amount_paid' => 5000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 1]
        ]
    ];

    // Request 1
    $res1 = $this->actingAs($cashier)->postJson('/api/transactions', $payload);
    $res1->assertStatus(201);

    // Request 2 (Retry with exact same UUID)
    $res2 = $this->actingAs($cashier)->postJson('/api/transactions', $payload);
    $res2->assertStatus(200); // Should return existing 200 OK

    // Verify database only has 1 transaction record for this UUID
    $this->assertEquals(1, Transaction::where('uuid', $uuid)->count());

    // Verify stock deducted only once (20 - 1 = 19)
    $this->assertEquals(19, $product->fresh()->stock);
});

test('admin can void transaction and stock is reversed', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $cashier = User::factory()->create(['role' => 'cashier']);
    $shift = Shift::create([
        'cashier_id' => $cashier->id,
        'opening_cash' => 50000,
        'opened_at' => now(),
        'status' => 'OPEN',
    ]);

    $category = Category::create(['name' => 'General']);
    $product = Product::create([
        'name' => 'Item to Void',
        'category_id' => $category->id,
        'sell_price' => 10000,
        'stock' => 10,
        'unit' => 'pcs',
    ]);

    // Create sale of 3 items (stock becomes 7)
    $txResponse = $this->actingAs($cashier)->postJson('/api/transactions', [
        'shift_id' => $shift->id,
        'payment_method' => 'CASH',
        'amount_paid' => 30000,
        'items' => [
            ['product_id' => $product->id, 'quantity' => 3]
        ]
    ]);

    $txId = $txResponse->json('data.id');
    $this->assertEquals(7, $product->fresh()->stock);

    // Void transaction
    $voidResponse = $this->actingAs($admin)->postJson("/api/transactions/{$txId}/void", [
        'reason' => 'Customer changed mind',
    ]);

    $voidResponse->assertStatus(200)
        ->assertJsonPath('data.status', 'VOID');

    // Verify stock reversed back from 7 to 10
    $this->assertEquals(10, $product->fresh()->stock);

    // Verify VOID_REVERSAL stock movement recorded
    $this->assertDatabaseHas('stock_movements', [
        'transaction_id' => $txId,
        'type' => 'VOID_REVERSAL',
        'quantity' => 3,
        'after_stock' => 10,
    ]);
});
