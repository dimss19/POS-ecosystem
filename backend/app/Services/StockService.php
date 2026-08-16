<?php

namespace App\Services;

use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class StockService
{
    /**
     * Adjust stock for a product atomically.
     * $quantityChange can be positive (add) or negative (deduct).
     */
    public function adjustStock(
        Product|int $product,
        int $quantityChange,
        string $type,
        ?string $reason = null,
        ?int $userId = null,
        ?int $transactionId = null
    ): Product {
        $productId = $product instanceof Product ? $product->id : $product;

        return DB::transaction(function () use ($productId, $quantityChange, $type, $reason, $userId, $transactionId) {
            /** @var Product $lockedProduct */
            $lockedProduct = Product::where('id', $productId)->lockForUpdate()->firstOrFail();

            $beforeStock = $lockedProduct->stock;
            $afterStock = $beforeStock + $quantityChange;

            if ($afterStock < 0) {
                throw new InvalidArgumentException("Insufficient stock for product: {$lockedProduct->name}. Current stock: {$beforeStock}, change: {$quantityChange}");
            }

            $lockedProduct->stock = $afterStock;
            $lockedProduct->save();

            StockMovement::create([
                'product_id' => $lockedProduct->id,
                'transaction_id' => $transactionId,
                'type' => $type,
                'quantity' => $quantityChange,
                'before_stock' => $beforeStock,
                'after_stock' => $afterStock,
                'reason' => $reason,
                'created_by' => $userId ?? auth()->id() ?? 1,
                'created_at' => now(),
            ]);

            AuditService::log('STOCK_ADJUSTED', Product::class, $lockedProduct->id, [
                'stock' => $beforeStock
            ], [
                'stock' => $afterStock,
                'type' => $type,
                'reason' => $reason
            ]);

            return $lockedProduct;
        });
    }
}
