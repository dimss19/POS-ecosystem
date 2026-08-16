<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Device;
use App\Models\Product;
use App\Models\User;
use App\Services\StockService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Users
        $admin = User::firstOrCreate(
            ['email' => 'admin@pos.com'],
            [
                'name' => 'System Admin',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'is_active' => true,
            ]
        );

        $cashier = User::firstOrCreate(
            ['email' => 'cashier@pos.com'],
            [
                'name' => 'Main Cashier',
                'password' => Hash::make('password123'),
                'role' => 'cashier',
                'is_active' => true,
            ]
        );

        // 2. Seed Device
        $device = Device::firstOrCreate(
            ['device_uuid' => 'DEV-DESKTOP-POS-001'],
            [
                'name' => 'Kasir Counter 1',
                'app_version' => '1.0.0',
                'last_seen_at' => now(),
                'is_active' => true,
            ]
        );

        // 3. Seed Categories
        $catBeverage = Category::firstOrCreate(['name' => 'Minuman'], ['description' => 'Aneka Minuman', 'is_active' => true]);
        $catFood = Category::firstOrCreate(['name' => 'Makanan'], ['description' => 'Aneka Makanan', 'is_active' => true]);
        $catGrocery = Category::firstOrCreate(['name' => 'Sembako'], ['description' => 'Kebutuhan Pokok', 'is_active' => true]);

        // 4. Seed Products with initial stock via StockService
        $stockService = app(StockService::class);

        $productsData = [
            [
                'sku' => 'BEV-001',
                'barcode' => '8991001001',
                'name' => 'Kopi Susu Gula Aren',
                'category_id' => $catBeverage->id,
                'buy_price' => 10000,
                'sell_price' => 18000,
                'stock' => 50,
                'minimum_stock' => 5,
                'unit' => 'cup',
            ],
            [
                'sku' => 'BEV-002',
                'barcode' => '8991001002',
                'name' => 'Teh Manis Dingin',
                'category_id' => $catBeverage->id,
                'buy_price' => 3000,
                'sell_price' => 7000,
                'stock' => 100,
                'minimum_stock' => 10,
                'unit' => 'cup',
            ],
            [
                'sku' => 'FOOD-001',
                'barcode' => '8992002001',
                'name' => 'Nasi Goreng Spesial',
                'category_id' => $catFood->id,
                'buy_price' => 15000,
                'sell_price' => 25000,
                'stock' => 30,
                'minimum_stock' => 5,
                'unit' => 'portion',
            ],
            [
                'sku' => 'GROC-001',
                'barcode' => '8993003001',
                'name' => 'Beras Premium 5kg',
                'category_id' => $catGrocery->id,
                'buy_price' => 65000,
                'sell_price' => 75000,
                'stock' => 20,
                'minimum_stock' => 3,
                'unit' => 'sack',
            ],
        ];

        foreach ($productsData as $pData) {
            $initialStock = $pData['stock'];
            $pData['stock'] = 0;

            $product = Product::firstOrCreate(
                ['sku' => $pData['sku']],
                $pData
            );

            if ($product->wasRecentlyCreated && $initialStock > 0) {
                $stockService->adjustStock(
                    product: $product,
                    quantityChange: $initialStock,
                    type: 'INITIAL_STOCK',
                    reason: 'System Seed Initial Stock',
                    userId: $admin->id
                );
            }
        }
    }
}
