/**
 * KASIR POS — Inventory Service
 *
 * Handles inventory queries, stock levels, stock movement records, and adjustments.
 *
 * Security:
 * - Parameterized queries are used exclusively.
 * - Transactions are processed atomically.
 */

import { execute, select, transaction } from './database';
import { getDeviceId } from './transaction';
import type { StockMovement } from '../types';

/**
 * Record a manual stock adjustment.
 * Updates product stock, inserts stock movement, and schedules sync task.
 */
export async function adjustStock(
  productId: number,
  currentStock: number,
  newStock: number,
  notes: string
): Promise<void> {
  const quantityDelta = newStock - currentStock;
  if (quantityDelta === 0) return;

  const now = new Date().toISOString();
  const deviceId = await getDeviceId();

  const ops: Array<{ sql: string; bindValues?: unknown[] }> = [];

  // 1. Update product stock
  ops.push({
    sql: "UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?",
    bindValues: [newStock, productId]
  });

  // 2. Insert stock movement record
  ops.push({
    sql: `INSERT INTO stock_movements (
      product_id, type, quantity, reference_id, notes, created_at
    ) VALUES (?, 'ADJUSTMENT', ?, ?, ?, ?)`,
    bindValues: [
      productId,
      quantityDelta,
      `ADJ-${now.substring(0, 10)}`,
      notes || 'Manual Adjustment',
      now
    ]
  });

  // 3. Queue update to sync queue
  const syncPayload = JSON.stringify({
    product_id: productId,
    quantity: quantityDelta,
    type: 'ADJUSTMENT',
    device_id: deviceId,
    notes: notes || 'Manual Adjustment',
    created_at: now
  });

  ops.push({
    sql: `INSERT INTO sync_queue (
      entity_type, entity_id, operation, payload, status, retry_count, created_at, updated_at
    ) VALUES ('inventory', ?, 'CREATE', ?, 'PENDING', 0, ?, ?)`,
    bindValues: [String(productId), syncPayload, now, now]
  });

  await transaction(ops);
}

/**
 * Get all stock movements for a specific product or general log.
 */
export async function getStockMovements(productId?: number): Promise<StockMovement[]> {
  if (productId) {
    return select<StockMovement>(
      'SELECT * FROM stock_movements WHERE product_id = ? ORDER BY created_at DESC',
      [productId]
    );
  }

  return select<StockMovement>(
    'SELECT * FROM stock_movements ORDER BY created_at DESC LIMIT 100'
  );
}
