<?php

namespace App\Services;

use App\Models\Product;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\TransactionItem;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class TransactionService
{
    public function __construct(
        protected StockService $stockService
    ) {}

    /**
     * Create a transaction atomically with idempotency check.
     */
    public function createTransaction(array $data, int $cashierId): Transaction
    {
        // 1. Idempotency Check
        if (!empty($data['uuid'])) {
            $existing = Transaction::where('uuid', $data['uuid'])->with('items')->first();
            if ($existing) {
                return $existing;
            }
        }

        // 2. Validate / resolve shift
        $shiftId = $data['shift_id'] ?? null;
        if ($shiftId) {
            $shiftExists = Shift::where('id', $shiftId)->exists();
            if (!$shiftExists) {
                $shiftId = null;
            }
        }

        if (!$shiftId) {
            $openShift = Shift::where('cashier_id', $cashierId)->where('status', 'OPEN')->first();
            if (!$openShift) {
                $openShift = Shift::create([
                    'cashier_id' => $cashierId,
                    'opening_cash' => 0,
                    'opened_at' => $data['client_created_at'] ?? now(),
                    'status' => 'OPEN',
                    'notes' => 'Auto-created shift for transactions',
                ]);
            }
            $shiftId = $openShift->id;
        }

        return DB::transaction(function () use ($data, $cashierId, $shiftId) {
            $itemsData = $data['items'] ?? [];
            if (empty($itemsData)) {
                throw new InvalidArgumentException("Transaction must contain at least one item.");
            }

            $subtotal = 0;
            $totalDiscount = $data['discount'] ?? 0;

            // Prepare items and snapshots
            $preparedItems = [];
            foreach ($itemsData as $item) {
                $product = Product::lockForUpdate()->findOrFail($item['product_id']);

                if (!$product->is_active) {
                    throw new InvalidArgumentException("Product {$product->name} is inactive and cannot be sold.");
                }

                $quantity = (int) $item['quantity'];
                $unitPrice = (float) ($item['unit_price'] ?? $product->sell_price);
                $itemDiscount = (float) ($item['discount'] ?? 0);
                $itemSubtotal = ($unitPrice * $quantity) - $itemDiscount;

                $subtotal += $itemSubtotal;

                $preparedItems[] = [
                    'product' => $product,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'discount' => $itemDiscount,
                    'subtotal' => $itemSubtotal,
                ];
            }

            $grandTotal = max(0, $subtotal - $totalDiscount);
            $amountPaid = (float) ($data['amount_paid'] ?? $grandTotal);
            $changeAmount = max(0, $amountPaid - $grandTotal);

            if ($data['payment_method'] === 'CASH' && $amountPaid < $grandTotal) {
                throw new InvalidArgumentException("Insufficient payment amount. Required: {$grandTotal}, Paid: {$amountPaid}");
            }

            // Create Transaction
            $transaction = Transaction::create([
                'uuid' => $data['uuid'] ?? (string) \Illuminate\Support\Str::uuid(),
                'device_id' => $data['device_id'] ?? null,
                'cashier_id' => $cashierId,
                'shift_id' => $shiftId,
                'subtotal' => $subtotal,
                'discount' => $totalDiscount,
                'total' => $grandTotal,
                'payment_method' => $data['payment_method'],
                'amount_paid' => $amountPaid,
                'change_amount' => $changeAmount,
                'status' => 'COMPLETED',
                'sync_status' => $data['sync_status'] ?? 'SYNCED',
                'client_created_at' => $data['client_created_at'] ?? now(),
                'server_created_at' => now(),
            ]);

            // Create Items & Deduct Stock
            foreach ($preparedItems as $prep) {
                /** @var Product $product */
                $product = $prep['product'];

                TransactionItem::create([
                    'transaction_id' => $transaction->id,
                    'product_id' => $product->id,
                    'product_name_snapshot' => $product->name,
                    'sku_snapshot' => $product->sku,
                    'barcode_snapshot' => $product->barcode,
                    'quantity' => $prep['quantity'],
                    'unit_price' => $prep['unit_price'],
                    'discount' => $prep['discount'],
                    'subtotal' => $prep['subtotal'],
                ]);

                $this->stockService->adjustStock(
                    product: $product,
                    quantityChange: -$prep['quantity'],
                    type: 'SALE',
                    reason: "Sale Transaction {$transaction->uuid}",
                    userId: $cashierId,
                    transactionId: $transaction->id
                );
            }

            AuditService::log('TRANSACTION_CREATED', Transaction::class, $transaction->id, null, [
                'uuid' => $transaction->uuid,
                'total' => $transaction->total
            ]);

            return $transaction->load('items');
        });
    }

    /**
     * Void a transaction and reverse stock.
     */
    public function voidTransaction(int $transactionId, string $reason, int $userId): Transaction
    {
        return DB::transaction(function () use ($transactionId, $reason, $userId) {
            $transaction = Transaction::where('id', $transactionId)->lockForUpdate()->firstOrFail();

            if ($transaction->status === 'VOID') {
                throw new InvalidArgumentException("Transaction is already voided.");
            }

            $transaction->status = 'VOID';
            $transaction->save();

            // Reverse stock for all items
            foreach ($transaction->items as $item) {
                $this->stockService->adjustStock(
                    product: $item->product_id,
                    quantityChange: $item->quantity,
                    type: 'VOID_REVERSAL',
                    reason: "Void Reversal for transaction {$transaction->uuid}: {$reason}",
                    userId: $userId,
                    transactionId: $transaction->id
                );
            }

            AuditService::log('TRANSACTION_VOIDED', Transaction::class, $transaction->id, [
                'status' => 'COMPLETED'
            ], [
                'status' => 'VOID',
                'reason' => $reason
            ]);

            return $transaction->load('items');
        });
    }
}
