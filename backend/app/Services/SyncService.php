<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Product;
use App\Models\SyncLog;
use Throwable;

class SyncService
{
    public function __construct(
        protected TransactionService $transactionService
    ) {}

    public function push(int $deviceId, array $transactions, int $cashierId): array
    {
        $results = [];
        $successCount = 0;
        $failedCount = 0;
        $errors = [];

        foreach ($transactions as $tx) {
            $uuid = $tx['uuid'] ?? null;
            try {
                $tx['device_id'] = $deviceId;
                $createdTx = $this->transactionService->createTransaction($tx, $cashierId);

                $results[] = [
                    'uuid' => $createdTx->uuid,
                    'status' => 'SUCCESS',
                    'transaction_id' => $createdTx->id,
                    'message' => 'Synced successfully',
                ];
                $successCount++;
            } catch (Throwable $e) {
                $failedCount++;
                $errors[] = [
                    'uuid' => $uuid,
                    'error' => $e->getMessage()
                ];
                $results[] = [
                    'uuid' => $uuid,
                    'status' => 'FAILED',
                    'message' => $e->getMessage(),
                ];
            }
        }

        $syncStatus = 'SUCCESS';
        if ($failedCount > 0 && $successCount > 0) {
            $syncStatus = 'PARTIAL';
        } elseif ($failedCount > 0 && $successCount === 0) {
            $syncStatus = 'FAILED';
        }

        SyncLog::create([
            'device_id' => $deviceId,
            'sync_type' => 'PUSH',
            'status' => $syncStatus,
            'records_count' => count($transactions),
            'errors' => !empty($errors) ? json_encode($errors) : null,
            'synced_at' => now(),
        ]);

        return [
            'status' => $syncStatus,
            'total' => count($transactions),
            'success_count' => $successCount,
            'failed_count' => $failedCount,
            'results' => $results,
        ];
    }

    public function pull(int $deviceId, ?string $lastSyncTimestamp = null): array
    {
        $categoryQuery = Category::query();
        $productQuery = Product::query();

        if ($lastSyncTimestamp) {
            $categoryQuery->where('updated_at', '>', $lastSyncTimestamp);
            $productQuery->where('updated_at', '>', $lastSyncTimestamp);
        }

        $categories = $categoryQuery->get();
        $products = $productQuery->get();

        SyncLog::create([
            'device_id' => $deviceId,
            'sync_type' => 'PULL',
            'status' => 'SUCCESS',
            'records_count' => $categories->count() + $products->count(),
            'synced_at' => now(),
        ]);

        return [
            'server_timestamp' => now()->toIso8601String(),
            'categories' => $categories,
            'products' => $products,
        ];
    }
}
