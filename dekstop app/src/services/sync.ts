/**
 * KASIR POS — Sync Service
 *
 * Implements the offline-first sync engine.
 * - Pushes local transaction/shift updates from the `sync_queue` table.
 * - Pulls product and category updates from the backend to refresh cache.
 * - Handles device registration.
 *
 * Security:
 * - Uses parameterized queries.
 * - Handles data safely with JSON parsing.
 */

import { api } from './api';
import { execute, select, transaction } from './database';
import { getDeviceId } from './transaction';
import type { SyncQueueItem, Product, Category } from '../types';

/**
 * Register the current device on the backend API.
 */
export async function registerDevice(): Promise<boolean> {
  try {
    const deviceId = await getDeviceId();
    const result = await api.post('/api/devices/register', {
      device_id: deviceId,
      name: 'KASIR POS Desktop App'
    });
    return result.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch pending or failed items from the sync queue.
 */
export async function getPendingSyncQueue(): Promise<SyncQueueItem[]> {
  return select<SyncQueueItem>(
    "SELECT * FROM sync_queue WHERE status IN ('PENDING', 'FAILED') ORDER BY created_at ASC"
  );
}

/**
 * Process a single sync queue item.
 * Implements idempotency by sending device_id and unique entity_id.
 */
export async function processSyncItem(item: SyncQueueItem): Promise<boolean> {
  const deviceId = await getDeviceId();
  
  // 1. Mark status as SYNCING
  await execute(
    "UPDATE sync_queue SET status = 'SYNCING', updated_at = datetime('now') WHERE id = ?",
    [item.id]
  );

  try {
    // 2. Parse original payload
    const parsedPayload = JSON.parse(item.payload);

    // 3. POST to /api/sync/push
    const result = await api.post<{ success: boolean }>('/api/sync/push', {
      device_id: deviceId,
      entity_type: item.entity_type,
      entity_id: item.entity_id,
      operation: item.operation,
      payload: parsedPayload
    });

    if (result.ok) {
      const ops: Array<{ sql: string; bindValues?: unknown[] }> = [];

      // Mark queue item as SYNCED
      ops.push({
        sql: "UPDATE sync_queue SET status = 'SYNCED', updated_at = datetime('now') WHERE id = ?",
        bindValues: [item.id]
      });

      // Update sync status in respective table
      if (item.entity_type === 'transaction') {
        ops.push({
          sql: "UPDATE transactions SET sync_status = 'SYNCED', updated_at = datetime('now') WHERE uuid = ?",
          bindValues: [item.entity_id]
        });
      } else if (item.entity_type === 'shift') {
        ops.push({
          sql: "UPDATE shifts SET sync_status = 'SYNCED', closed_at = datetime('now') WHERE id = ?",
          bindValues: [Number(item.entity_id)]
        });
      }

      await transaction(ops);
      return true;
    } else {
      // API returned failure response
      await markSyncItemFailed(item.id, item.retry_count, result.message);
      return false;
    }
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : 'Kesalahan jaringan atau server';
    await markSyncItemFailed(item.id, item.retry_count, errMsg);
    return false;
  }
}

/**
 * Update sync item status to FAILED and increment retry count.
 */
async function markSyncItemFailed(id: number, currentRetryCount: number, error: string): Promise<void> {
  await execute(
    `UPDATE sync_queue 
     SET status = 'FAILED', 
         retry_count = ?, 
         last_error = ?, 
         updated_at = datetime('now') 
     WHERE id = ?`,
    [currentRetryCount + 1, error, id]
  );
}

/**
 * Pull products and categories updates from backend.
 * Caches them locally in SQLite.
 */
export async function pullData(): Promise<{ success: boolean; message: string }> {
  try {
    const deviceId = await getDeviceId();
    const result = await api.post<{ categories: Category[]; products: Product[] }>('/api/sync/pull', {
      device_id: deviceId
    });

    if (!result.ok || !result.data) {
      return { success: false, message: result.message || 'Gagal menarik data' };
    }

    const { categories, products } = result.data;
    const operations: Array<{ sql: string; bindValues?: unknown[] }> = [];

    // Cache categories
    for (const cat of categories) {
      operations.push({
        sql: `INSERT INTO categories (id, name, created_at, updated_at) 
              VALUES (?, ?, ?, ?) 
              ON CONFLICT(id) DO UPDATE SET name = excluded.name, updated_at = excluded.updated_at`,
        bindValues: [cat.id, cat.name, cat.created_at, cat.updated_at]
      });
    }

    // Cache products
    for (const prod of products) {
      operations.push({
        sql: `INSERT INTO products (id, name, sku, barcode, price, stock, min_stock, is_active, category_id, image_url, created_at, updated_at) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
              ON CONFLICT(id) DO UPDATE SET 
                name = excluded.name, 
                sku = excluded.sku, 
                barcode = excluded.barcode, 
                price = excluded.price, 
                stock = excluded.stock, 
                min_stock = excluded.min_stock, 
                is_active = excluded.is_active, 
                category_id = excluded.category_id, 
                image_url = excluded.image_url, 
                updated_at = excluded.updated_at`,
        bindValues: [
          prod.id, prod.name, prod.sku || '', prod.barcode || '', prod.price, 
          prod.stock, prod.min_stock, prod.is_active ? 1 : 0, prod.category_id, 
          prod.image_url || null, prod.created_at, prod.updated_at
        ]
      });
    }

    if (operations.length > 0) {
      await transaction(operations);
    }

    return { success: true, message: 'Data berhasil disinkronisasi dari server' };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Gagal terhubung ke server saat sinkronisasi data'
    };
  }
}

/**
 * Get sync queue statistics.
 */
export async function getSyncStats(): Promise<{ pending: number; syncing: number; synced: number; failed: number }> {
  const rows = await select<{ status: string; count: number }>(
    'SELECT status, COUNT(*) as count FROM sync_queue GROUP BY status'
  );

  const stats = { pending: 0, syncing: 0, synced: 0, failed: 0 };
  for (const row of rows) {
    if (row.status === 'PENDING') stats.pending = row.count;
    else if (row.status === 'SYNCING') stats.syncing = row.count;
    else if (row.status === 'SYNCED') stats.synced = row.count;
    else if (row.status === 'FAILED') stats.failed = row.count;
  }
  return stats;
}

/**
 * Get list of failed sync queue items for detail view.
 */
export async function getFailedSyncItems(): Promise<SyncQueueItem[]> {
  return select<SyncQueueItem>(
    "SELECT * FROM sync_queue WHERE status = 'FAILED' ORDER BY updated_at DESC"
  );
}

/**
 * Reset a failed queue item back to PENDING so it can be retried.
 */
export async function resetFailedSyncItem(id: number): Promise<void> {
  await execute(
    "UPDATE sync_queue SET status = 'PENDING', last_error = null, updated_at = datetime('now') WHERE id = ?",
    [id]
  );
}

/**
 * Reset all failed queue items back to PENDING.
 */
export async function resetAllFailedSyncItems(): Promise<void> {
  await execute(
    "UPDATE sync_queue SET status = 'PENDING', last_error = null, updated_at = datetime('now') WHERE status = 'FAILED'"
  );
}
