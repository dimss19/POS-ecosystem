/**
 * KASIR POS — Shift Service
 *
 * Handles cashier shift lifecycle (open, active details, close, and calculations).
 *
 * Security:
 * - Uses parameterized queries exclusively.
 * - Transactions are processed atomically.
 */

import { execute, select, transaction } from './database';
import { getDeviceId } from './transaction';
import type { Shift } from '../types';

/**
 * Get current active shift for this device.
 * Only one shift can be active (OPEN) at any time.
 */
export async function getActiveShift(): Promise<Shift | null> {
  const rows = await select<Shift>(
    "SELECT * FROM shifts WHERE status = 'OPEN' LIMIT 1"
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Opens a new shift locally.
 */
export async function openShift(
  cashierId: number,
  cashierName: string,
  openingCash: number
): Promise<Shift> {
  // Check if there is already an active shift
  const active = await getActiveShift();
  if (active) {
    throw new Error('Shift sebelumnya masih terbuka. Tutup shift terlebih dahulu.');
  }

  const deviceId = await getDeviceId();
  const now = new Date().toISOString();

  const ops: Array<{ sql: string; bindValues?: unknown[] }> = [];

  // Insert shift
  ops.push({
    sql: `INSERT INTO shifts (
      cashier_id, cashier_name, opening_cash, status, sync_status, device_id, opened_at
    ) VALUES (?, ?, ?, 'OPEN', 'PENDING', ?, ?)`,
    bindValues: [cashierId, cashierName, openingCash, deviceId, now]
  });

  await transaction(ops);

  // Get and return newly opened shift
  const newShiftRows = await select<Shift>(
    "SELECT * FROM shifts WHERE status = 'OPEN' LIMIT 1"
  );
  if (newShiftRows.length === 0) {
    throw new Error('Gagal membuka shift');
  }
  const newShift = newShiftRows[0];

  // Insert to sync queue
  const syncPayload = JSON.stringify({
    id: newShift.id,
    cashier_id: cashierId,
    cashier_name: cashierName,
    opening_cash: openingCash,
    status: 'OPEN',
    device_id: deviceId,
    opened_at: now
  });

  await execute(
    `INSERT INTO sync_queue (
      entity_type, entity_id, operation, payload, status, retry_count, created_at, updated_at
    ) VALUES ('shift', ?, 'CREATE', ?, 'PENDING', 0, ?, ?)`,
    [String(newShift.id), syncPayload, now, now]
  );

  return newShift;
}

/**
 * Get active shift stats like cash sales.
 */
export async function getActiveShiftStats(shiftId: number): Promise<{ cashSales: number; expectedCash: number }> {
  // Calculate cash sales
  const salesRows = await select<{ total: number }>(
    `SELECT SUM(total) as total 
     FROM transactions 
     WHERE shift_id = ? 
       AND payment_method = 'CASH' 
       AND status = 'COMPLETED'`,
    [shiftId]
  );
  
  const cashSales = salesRows[0]?.total ?? 0;

  // Expected cash = opening cash + cash sales
  const shiftRows = await select<{ opening_cash: number }>(
    "SELECT opening_cash FROM shifts WHERE id = ?",
    [shiftId]
  );
  const openingCash = shiftRows[0]?.opening_cash ?? 0;
  const expectedCash = openingCash + cashSales;

  return {
    cashSales,
    expectedCash
  };
}

/**
 * Closes the active shift.
 */
export async function closeShift(
  shiftId: number,
  actualCash: number
): Promise<void> {
  const deviceId = await getDeviceId();
  const now = new Date().toISOString();

  // Get active shift stats
  const { cashSales, expectedCash } = await getActiveShiftStats(shiftId);

  const ops: Array<{ sql: string; bindValues?: unknown[] }> = [];

  // Update shift to CLOSED
  ops.push({
    sql: `UPDATE shifts SET 
      closing_cash = ?, 
      expected_cash = ?, 
      cash_sales = ?, 
      status = 'CLOSED', 
      sync_status = 'PENDING', 
      closed_at = ? 
      WHERE id = ?`,
    bindValues: [actualCash, expectedCash, cashSales, now, shiftId]
  });

  await transaction(ops);

  // Queue to sync queue
  const syncPayload = JSON.stringify({
    id: shiftId,
    closing_cash: actualCash,
    expected_cash: expectedCash,
    cash_sales: cashSales,
    status: 'CLOSED',
    device_id: deviceId,
    closed_at: now
  });

  await execute(
    `INSERT INTO sync_queue (
      entity_type, entity_id, operation, payload, status, retry_count, created_at, updated_at
    ) VALUES ('shift', ?, 'UPDATE', ?, 'PENDING', 0, ?, ?)`,
    [String(shiftId), syncPayload, now, now]
  );
}

/**
 * Get all shifts.
 */
export async function getShifts(): Promise<Shift[]> {
  return select<Shift>(
    "SELECT * FROM shifts ORDER BY opened_at DESC"
  );
}
