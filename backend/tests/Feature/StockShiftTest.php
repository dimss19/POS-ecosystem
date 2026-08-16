<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\Shift;
use App\Models\User;

test('cashier can open and close shift with correct expected cash', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);

    // Open Shift
    $openResponse = $this->actingAs($cashier)
        ->postJson('/api/shifts/open', [
            'opening_cash' => 100000,
            'notes' => 'Pagi shift',
        ]);

    $openResponse->assertStatus(201)
        ->assertJsonPath('data.status', 'OPEN');

    $shiftId = $openResponse->json('data.id');

    // Prevent duplicate open shift
    $duplicateResponse = $this->actingAs($cashier)
        ->postJson('/api/shifts/open', [
            'opening_cash' => 50000,
        ]);

    $duplicateResponse->assertStatus(422);

    // Close Shift
    $closeResponse = $this->actingAs($cashier)
        ->postJson("/api/shifts/{$shiftId}/close", [
            'closing_cash' => 100000,
        ]);

    $closeResponse->assertStatus(200)
        ->assertJsonPath('data.status', 'CLOSED')
        ->assertJsonPath('data.expected_cash', "100000.00")
        ->assertJsonPath('data.difference', "0.00");
});

test('admin can perform manual stock adjustment', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $category = Category::create(['name' => 'General']);
    $product = Product::create([
        'name' => 'Stock Test Item',
        'category_id' => $category->id,
        'sell_price' => 10000,
        'stock' => 20,
        'unit' => 'pcs',
    ]);

    $response = $this->actingAs($admin)
        ->postJson('/api/stock/adjustments', [
            'product_id' => $product->id,
            'quantity_change' => -5,
            'reason' => 'Broken item',
        ]);

    $response->assertStatus(200)
        ->assertJsonPath('data.stock', 15);

    $this->assertDatabaseHas('stock_movements', [
        'product_id' => $product->id,
        'type' => 'ADJUSTMENT',
        'quantity' => -5,
        'before_stock' => 20,
        'after_stock' => 15,
        'reason' => 'Broken item',
    ]);
});
