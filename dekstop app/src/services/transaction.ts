/**
 * KASIR POS — Transaction Service
 *
 * Handles transaction creation, listing, voiding, and local inventory stock updates.
 *
 * Security:
 * - Parameterized queries are used exclusively.
 * - Transactions are wrapped in atomic database transactions.
 */

import { execute, select, transaction } from './database';
import type { Transaction, TransactionItem, PaymentMethod } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Get or generate a persistent device ID for sync purposes.
 */
export async function getDeviceId(): Promise<string> {
  const rows = await select<{ value: string }>(
    "SELECT value FROM settings WHERE key = 'device_id'"
  );
  if (rows.length > 0) {
    return rows[0].value;
  }
  const newId = uuidv4();
  await execute(
    "INSERT INTO settings (key, value, updated_at) VALUES ('device_id', ?, datetime('now'))",
    [newId]
  );
  return newId;
}

interface CreateTransactionParams {
  shiftId: number;
  cashierId: number;
  cashierName: string;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  amountPaid: number;
  change: number;
  items: Array<{
    product_id: number;
    product_name: string;
    barcode: string;
    price: number;
    quantity: number;
    subtotal: number;
  }>;
}

/**
 * Creates a new transaction locally.
 * Performs database transaction to save transaction, items, update stock, and insert sync queue.
 */
export async function createTransaction(params: CreateTransactionParams): Promise<Transaction> {
  const uuid = uuidv4();
  const deviceId = await getDeviceId();
  const now = new Date().toISOString();

  // 1. Prepare operations for atomic transaction
  const operations: Array<{ sql: string; bindValues?: unknown[] }> = [];

  // Insert transaction
  operations.push({
    sql: `INSERT INTO transactions (
      uuid, shift_id, cashier_id, cashier_name, subtotal, discount, total, 
      payment_method, amount_paid, change, status, sync_status, device_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', 'PENDING', ?, ?, ?)`,
    bindValues: [
      uuid,
      params.shiftId,
      params.cashierId,
      params.cashierName,
      params.subtotal,
      params.discount,
      params.total,
      params.paymentMethod,
      params.amountPaid,
      params.change,
      deviceId,
      now,
      now
    ]
  });

  // Insert items, update product stock, and insert stock movements
  for (const item of params.items) {
    // Insert item
    operations.push({
      sql: `INSERT INTO transaction_items (
        transaction_id, product_id, product_name, price, quantity, subtotal, created_at
      ) VALUES ((SELECT id FROM transactions WHERE uuid = ?), ?, ?, ?, ?, ?, ?)`,
      bindValues: [
        uuid,
        item.product_id,
        item.product_name,
        item.price,
        item.quantity,
        item.subtotal,
        now
      ]
    });

    // Update product stock (decrement)
    operations.push({
      sql: `UPDATE products SET stock = stock - ?, updated_at = datetime('now') WHERE id = ?`,
      bindValues: [item.quantity, item.product_id]
    });

    // Insert stock movement
    operations.push({
      sql: `INSERT INTO stock_movements (
        product_id, type, quantity, reference_id, notes, created_at
      ) VALUES (?, 'SALE', ?, ?, ?, ?)`,
      bindValues: [
        item.product_id,
        -item.quantity, // Sales decrement stock
        uuid,
        `Penjualan ${uuid.substring(0, 8).toUpperCase()}`,
        now
      ]
    });
  }

  // Create Sync Queue Payload
  const syncPayload = JSON.stringify({
    uuid,
    shift_id: params.shiftId,
    cashier_id: params.cashierId,
    cashier_name: params.cashierName,
    subtotal: params.subtotal,
    discount: params.discount,
    total: params.total,
    payment_method: params.paymentMethod,
    amount_paid: params.amountPaid,
    change: params.change,
    status: 'COMPLETED',
    device_id: deviceId,
    created_at: now,
    items: params.items.map(item => ({
      product_id: item.product_id,
      product_name: item.product_name,
      price: item.price,
      quantity: item.quantity,
      subtotal: item.subtotal
    }))
  });

  // Insert to Sync Queue
  operations.push({
    sql: `INSERT INTO sync_queue (
      entity_type, entity_id, operation, payload, status, retry_count, created_at, updated_at
    ) VALUES ('transaction', ?, 'CREATE', ?, 'PENDING', 0, ?, ?)`,
    bindValues: [uuid, syncPayload, now, now]
  });

  // 2. Execute database transaction
  await transaction(operations);

  // 3. Query and return the newly created transaction
  const rows = await select<Transaction>(
    'SELECT * FROM transactions WHERE uuid = ?',
    [uuid]
  );
  
  if (rows.length === 0) {
    throw new Error('Gagal membuat transaksi');
  }
  
  return rows[0];
}

/**
 * Void an existing transaction locally.
 * Reverses stock and queues update for sync.
 */
export async function voidTransaction(transactionId: number): Promise<void> {
  const now = new Date().toISOString();
  const deviceId = await getDeviceId();

  // Find transaction
  const txRows = await select<Transaction>(
    'SELECT * FROM transactions WHERE id = ?',
    [transactionId]
  );
  if (txRows.length === 0) {
    throw new Error('Transaksi tidak ditemukan');
  }
  const tx = txRows[0];

  if (tx.status === 'VOID') {
    throw new Error('Transaksi sudah dibatalkan sebelumnya');
  }

  // Find items
  const items = await select<TransactionItem>(
    'SELECT * FROM transaction_items WHERE transaction_id = ?',
    [transactionId]
  );

  const operations: Array<{ sql: string; bindValues?: unknown[] }> = [];

  // Update status to VOID
  operations.push({
    sql: `UPDATE transactions SET status = 'VOID', sync_status = 'PENDING', updated_at = ? WHERE id = ?`,
    bindValues: [now, transactionId]
  });

  // Reverse stock and insert stock movements for each item
  for (const item of items) {
    // Increment product stock
    operations.push({
      sql: `UPDATE products SET stock = stock + ?, updated_at = datetime('now') WHERE id = ?`,
      bindValues: [item.quantity, item.product_id]
    });

    // Insert stock movement
    operations.push({
      sql: `INSERT INTO stock_movements (
        product_id, type, quantity, reference_id, notes, created_at
      ) VALUES (?, 'VOID_REVERSAL', ?, ?, ?, ?)`,
      bindValues: [
        item.product_id,
        item.quantity, // Reversal increments stock
        tx.uuid,
        `Pembatalan Transaksi ${tx.uuid.substring(0, 8).toUpperCase()}`,
        now
      ]
    });
  }

  // Sync Queue Payload for Void (updates transaction status to VOID)
  const syncPayload = JSON.stringify({
    uuid: tx.uuid,
    status: 'VOID',
    device_id: deviceId,
    updated_at: now
  });

  operations.push({
    sql: `INSERT INTO sync_queue (
      entity_type, entity_id, operation, payload, status, retry_count, created_at, updated_at
    ) VALUES ('transaction', ?, 'UPDATE', ?, 'PENDING', 0, ?, ?)`,
    bindValues: [tx.uuid, syncPayload, now, now]
  });

  await transaction(operations);
}

/**
 * Fetch all transactions locally.
 */
export async function getTransactions(): Promise<Transaction[]> {
  return select<Transaction>(
    'SELECT * FROM transactions ORDER BY created_at DESC'
  );
}

/**
 * Fetch items for a transaction.
 */
export async function getTransactionItems(transactionId: number): Promise<TransactionItem[]> {
  return select<TransactionItem>(
    'SELECT * FROM transaction_items WHERE transaction_id = ?',
    [transactionId]
  );
}
