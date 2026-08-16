<?php

use App\Models\Category;
use App\Models\Product;
use App\Models\User;

test('admin can create category and product with initial stock', function () {
    $admin = User::factory()->create(['role' => 'admin']);

    $categoryResponse = $this->actingAs($admin)
        ->postJson('/api/categories', [
            'name' => 'Elektronik',
            'description' => 'Gadget dan komponen',
        ]);

    $categoryResponse->assertStatus(201);
    $categoryId = $categoryResponse->json('data.id');

    $productResponse = $this->actingAs($admin)
        ->postJson('/api/products', [
            'sku' => 'ELEC-001',
            'barcode' => '1234567890',
            'name' => 'USB Cable Type C',
            'category_id' => $categoryId,
            'buy_price' => 15000,
            'sell_price' => 30000,
            'stock' => 25,
            'minimum_stock' => 5,
            'unit' => 'pcs',
        ]);

    $productResponse->assertStatus(201)
        ->assertJsonPath('data.stock', 25);

    $this->assertDatabaseHas('stock_movements', [
        'type' => 'INITIAL_STOCK',
        'quantity' => 25,
    ]);
});

test('cashier cannot create product', function () {
    $cashier = User::factory()->create(['role' => 'cashier']);
    $category = Category::create(['name' => 'Umum']);

    $response = $this->actingAs($cashier)
        ->postJson('/api/products', [
            'name' => 'Unauthorized Item',
            'category_id' => $category->id,
            'sell_price' => 10000,
            'unit' => 'pcs',
        ]);

    $response->assertStatus(403);
});

test('product deactivation does not delete product row', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $category = Category::create(['name' => 'Umum']);
    $product = Product::create([
        'name' => 'Product to Deactivate',
        'category_id' => $category->id,
        'sell_price' => 5000,
        'unit' => 'pcs',
        'is_active' => true,
    ]);

    $response = $this->actingAs($admin)
        ->deleteJson("/api/products/{$product->id}");

    $response->assertStatus(200);

    $this->assertDatabaseHas('products', [
        'id' => $product->id,
        'is_active' => false,
    ]);
});
