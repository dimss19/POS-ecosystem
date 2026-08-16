/**
 * KASIR POS — Database Service
 *
 * Provides typed access to the local SQLite database via Tauri SQL plugin,
 * with an automatic in-browser storage mock when previewing outside Tauri runtime.
 *
 * Security:
 * - All user inputs are passed as bind parameters (SQL injection prevention)
 * - No raw SQL interpolation anywhere
 */

import Database from '@tauri-apps/plugin-sql';
import { MIGRATIONS } from './migrations';

// Singleton database instance
let db: Database | null = null;

const isTauriRuntime = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

// --- Browser Mock Store ---
interface MockDb {
  categories: Array<{ id: number; name: string; created_at: string; updated_at: string }>;
  products: Array<{
    id: number;
    name: string;
    sku: string;
    barcode: string;
    price: number;
    stock: number;
    min_stock: number;
    is_active: number;
    category_id: number;
    image_url: string | null;
    created_at: string;
    updated_at: string;
  }>;
  shifts: Array<{
    id: number;
    cashier_id: number;
    cashier_name: string;
    opening_cash: number;
    closing_cash: number | null;
    expected_cash: number | null;
    cash_sales: number;
    cash_refunds: number;
    status: string;
    sync_status: string;
    device_id: string;
    opened_at: string;
    closed_at: string | null;
  }>;
  transactions: Array<{
    id: number;
    uuid: string;
    shift_id: number;
    cashier_id: number;
    cashier_name: string;
    subtotal: number;
    discount: number;
    total: number;
    payment_method: string;
    amount_paid: number;
    change: number;
    status: string;
    sync_status: string;
    device_id: string;
    created_at: string;
    updated_at: string;
  }>;
  transaction_items: Array<{
    id: number;
    transaction_id: number;
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    subtotal: number;
    created_at: string;
  }>;
  stock_movements: Array<{
    id: number;
    product_id: number;
    type: string;
    quantity_change: number;
    quantity_before: number;
    quantity_after: number;
    reason: string;
    user_id: number;
    created_at: string;
  }>;
  sync_queue: Array<{
    id: number;
    entity_type: string;
    entity_id: string;
    operation: string;
    payload: string;
    status: string;
    retry_count: number;
    last_error: string | null;
    created_at: string;
    updated_at: string;
  }>;
  settings: Record<string, string>;
}

const mockDbKey = 'kasir_pos_mock_db_v1';

function getMockDb(): MockDb {
  const stored = localStorage.getItem(mockDbKey);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  const initialDb: MockDb = {
    categories: [
      { id: 1, name: 'Coffee & Beverages', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 2, name: 'Bakery & Pastry', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 3, name: 'Main Course', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { id: 4, name: 'Snacks & Sides', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    ],
    products: [
      {
        id: 1,
        name: 'Kopi Susu Gula Aren',
        sku: 'CF-001',
        barcode: '8991001',
        price: 22000,
        stock: 45,
        min_stock: 10,
        is_active: 1,
        category_id: 1,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 2,
        name: 'Americano Double Shot',
        sku: 'CF-002',
        barcode: '8991002',
        price: 20000,
        stock: 30,
        min_stock: 5,
        is_active: 1,
        category_id: 1,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 3,
        name: 'Butter Croissant',
        sku: 'BK-001',
        barcode: '8991003',
        price: 25000,
        stock: 18,
        min_stock: 5,
        is_active: 1,
        category_id: 2,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 4,
        name: 'Matcha Latte Ice',
        sku: 'CF-003',
        barcode: '8991004',
        price: 28000,
        stock: 22,
        min_stock: 5,
        is_active: 1,
        category_id: 1,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 5,
        name: 'Nasi Goreng Spesial',
        sku: 'FD-001',
        barcode: '8991005',
        price: 35000,
        stock: 15,
        min_stock: 3,
        is_active: 1,
        category_id: 3,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 6,
        name: 'French Fries Truffle',
        sku: 'SN-001',
        barcode: '8991006',
        price: 24000,
        stock: 25,
        min_stock: 5,
        is_active: 1,
        category_id: 4,
        image_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
    shifts: [
      {
        id: 1,
        cashier_id: 1,
        cashier_name: 'Budi Santoso',
        opening_cash: 100000,
        closing_cash: null,
        expected_cash: 189000,
        cash_sales: 89000,
        cash_refunds: 0,
        status: 'OPEN',
        sync_status: 'SYNCED',
        device_id: 'DESKTOP-POS-01',
        opened_at: new Date().toISOString(),
        closed_at: null,
      },
    ],
    transactions: [
      {
        id: 1,
        uuid: '550e8400-e29b-41d4-a716-446655440001',
        shift_id: 1,
        cashier_id: 1,
        cashier_name: 'Budi Santoso',
        subtotal: 47000,
        discount: 0,
        total: 47000,
        payment_method: 'CASH',
        amount_paid: 50000,
        change: 3000,
        status: 'COMPLETED',
        sync_status: 'SYNCED',
        device_id: 'DESKTOP-POS-01',
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 2,
        uuid: '550e8400-e29b-41d4-a716-446655440002',
        shift_id: 1,
        cashier_id: 1,
        cashier_name: 'Budi Santoso',
        subtotal: 42000,
        discount: 0,
        total: 42000,
        payment_method: 'QRIS',
        amount_paid: 42000,
        change: 0,
        status: 'COMPLETED',
        sync_status: 'SYNCED',
        device_id: 'DESKTOP-POS-01',
        created_at: new Date(Date.now() - 1800000).toISOString(),
        updated_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    transaction_items: [
      {
        id: 1,
        transaction_id: 1,
        product_id: 1,
        product_name: 'Kopi Susu Gula Aren',
        price: 22000,
        quantity: 1,
        subtotal: 22000,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 2,
        transaction_id: 1,
        product_id: 3,
        product_name: 'Butter Croissant',
        price: 25000,
        quantity: 1,
        subtotal: 25000,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 3,
        transaction_id: 2,
        product_id: 2,
        product_name: 'Americano Double Shot',
        price: 20000,
        quantity: 1,
        subtotal: 20000,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 4,
        transaction_id: 2,
        product_id: 1,
        product_name: 'Kopi Susu Gula Aren',
        price: 22000,
        quantity: 1,
        subtotal: 22000,
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ],
    stock_movements: [
      {
        id: 1,
        product_id: 1,
        type: 'SALE',
        quantity_change: -2,
        quantity_before: 47,
        quantity_after: 45,
        reason: 'Penjualan Kasir POS',
        user_id: 1,
        created_at: new Date().toISOString(),
      },
    ],
    sync_queue: [
      {
        id: 1,
        entity_type: 'transaction',
        entity_id: '550e8400-e29b-41d4-a716-446655440001',
        operation: 'INSERT',
        payload: '{}',
        status: 'SYNCED',
        retry_count: 0,
        last_error: null,
        created_at: new Date(Date.now() - 3600000).toISOString(),
        updated_at: new Date(Date.now() - 3600000).toISOString(),
      },
    ],
    settings: {
      store_name: 'KASIR POS Coffee & Resto',
      store_address: 'Jl. Boulevard No. 88, Jakarta',
      store_phone: '0812-3456-7890',
      receipt_footer: 'Terima kasih atas kunjungan Anda!',
      device_id: 'DESKTOP-POS-01',
    },
  };

  localStorage.setItem(mockDbKey, JSON.stringify(initialDb));
  return initialDb;
}

function saveMockDb(data: MockDb): void {
  localStorage.setItem(mockDbKey, JSON.stringify(data));
}

/**
 * Get or initialize the database connection.
 * Runs migrations on first connection.
 */
export async function getDatabase(): Promise<Database> {
  if (db) return db;

  if (isTauriRuntime) {
    db = await Database.load('sqlite:kasir_pos.db');
    await runMigrations(db);
    return db;
  }

  // In browser preview, return mock object matching Database interface
  return {
    execute: async (_sql: string, _bindValues?: unknown[]) => ({ rowsAffected: 1, lastInsertId: 1 }),
    select: async <T>(_sql: string, _bindValues?: unknown[]): Promise<T> => [] as unknown as T,
    close: async () => true,
  } as unknown as Database;
}

/**
 * Run all pending migrations.
 */
async function runMigrations(database: Database): Promise<void> {
  await database.execute('PRAGMA journal_mode=WAL');
  await database.execute('PRAGMA foreign_keys=ON');

  for (const sql of MIGRATIONS) {
    await database.execute(sql);
  }
}

/**
 * Execute a parameterized query that modifies data (INSERT, UPDATE, DELETE).
 * Returns the number of rows affected and the last insert row ID.
 */
export async function execute(
  sql: string,
  bindValues: unknown[] = []
): Promise<{ rowsAffected: number; lastInsertId: number }> {
  if (isTauriRuntime) {
    const database = await getDatabase();
    const result = await database.execute(sql, bindValues);
    return {
      rowsAffected: result.rowsAffected,
      lastInsertId: result.lastInsertId ?? 0,
    };
  }

  const mdb = getMockDb();
  const lowerSql = sql.toLowerCase();

  if (lowerSql.includes('insert into products')) {
    const id = mdb.products.length + 1;
    mdb.products.push({
      id,
      name: String(bindValues[0] || 'Produk'),
      sku: String(bindValues[1] || ''),
      barcode: String(bindValues[2] || ''),
      price: Number(bindValues[3] || 0),
      stock: Number(bindValues[4] || 0),
      min_stock: Number(bindValues[5] || 0),
      is_active: Number(bindValues[6] ?? 1),
      category_id: Number(bindValues[7] || 1),
      image_url: bindValues[8] ? String(bindValues[8]) : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    saveMockDb(mdb);
    return { rowsAffected: 1, lastInsertId: id };
  }

  if (lowerSql.includes('update products') && lowerSql.includes('stock = stock -')) {
    const qty = Number(bindValues[0]);
    const pId = Number(bindValues[1]);
    const prod = mdb.products.find((p) => p.id === pId);
    if (prod) {
      prod.stock = Math.max(0, prod.stock - qty);
      saveMockDb(mdb);
    }
    return { rowsAffected: 1, lastInsertId: 0 };
  }

  if (lowerSql.includes('insert into transactions')) {
    const id = mdb.transactions.length + 1;
    mdb.transactions.unshift({
      id,
      uuid: String(bindValues[0]),
      shift_id: Number(bindValues[1]),
      cashier_id: Number(bindValues[2]),
      cashier_name: String(bindValues[3]),
      subtotal: Number(bindValues[4]),
      discount: Number(bindValues[5]),
      total: Number(bindValues[6]),
      payment_method: String(bindValues[7]),
      amount_paid: Number(bindValues[8]),
      change: Number(bindValues[9]),
      status: 'COMPLETED',
      sync_status: 'PENDING',
      device_id: String(bindValues[10]),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    saveMockDb(mdb);
    return { rowsAffected: 1, lastInsertId: id };
  }

  if (lowerSql.includes('insert into transaction_items')) {
    const id = mdb.transaction_items.length + 1;
    mdb.transaction_items.push({
      id,
      transaction_id: Number(bindValues[0]),
      product_id: Number(bindValues[1]),
      product_name: String(bindValues[2]),
      price: Number(bindValues[3]),
      quantity: Number(bindValues[4]),
      subtotal: Number(bindValues[5]),
      created_at: new Date().toISOString(),
    });
    saveMockDb(mdb);
    return { rowsAffected: 1, lastInsertId: id };
  }

  if (lowerSql.includes('insert into settings')) {
    mdb.settings[String(bindValues[0])] = String(bindValues[1]);
    saveMockDb(mdb);
    return { rowsAffected: 1, lastInsertId: 1 };
  }

  return { rowsAffected: 1, lastInsertId: 1 };
}

/**
 * Execute a parameterized SELECT query.
 * Returns an array of typed rows.
 */
export async function select<T>(
  sql: string,
  bindValues: unknown[] = []
): Promise<T[]> {
  if (isTauriRuntime) {
    const database = await getDatabase();
    return await database.select<T[]>(sql, bindValues);
  }

  const mdb = getMockDb();
  const lowerSql = sql.toLowerCase();

  if (lowerSql.includes('from categories')) {
    return mdb.categories as unknown as T[];
  }

  if (lowerSql.includes('from products')) {
    if (lowerSql.includes('is_active = 1') || lowerSql.includes('where is_active = 1')) {
      return mdb.products.filter((p) => p.is_active === 1) as unknown as T[];
    }
    return mdb.products as unknown as T[];
  }

  if (lowerSql.includes('from shifts')) {
    if (lowerSql.includes("status = 'open'")) {
      const openShift = mdb.shifts.find((s) => s.status === 'OPEN');
      return (openShift ? [openShift] : []) as unknown as T[];
    }
    return mdb.shifts as unknown as T[];
  }

  if (lowerSql.includes('from transactions')) {
    if (lowerSql.includes('uuid = ?')) {
      const tx = mdb.transactions.find((t) => t.uuid === bindValues[0]);
      return (tx ? [tx] : []) as unknown as T[];
    }
    return mdb.transactions as unknown as T[];
  }

  if (lowerSql.includes('from transaction_items')) {
    if (lowerSql.includes('transaction_id = ?')) {
      return mdb.transaction_items.filter((ti) => ti.transaction_id === bindValues[0]) as unknown as T[];
    }
    return mdb.transaction_items as unknown as T[];
  }

  if (lowerSql.includes('from stock_movements')) {
    return mdb.stock_movements as unknown as T[];
  }

  if (lowerSql.includes('from sync_queue')) {
    if (lowerSql.includes('count(*)')) {
      return [
        { status: 'SYNCED', count: mdb.sync_queue.filter((s) => s.status === 'SYNCED').length },
        { status: 'PENDING', count: mdb.sync_queue.filter((s) => s.status === 'PENDING').length },
        { status: 'FAILED', count: mdb.sync_queue.filter((s) => s.status === 'FAILED').length },
      ] as unknown as T[];
    }
    return mdb.sync_queue as unknown as T[];
  }

  if (lowerSql.includes('from settings')) {
    const key = String(bindValues[0]);
    const val = mdb.settings[key];
    return (val !== undefined ? [{ value: val }] : []) as unknown as T[];
  }

  return [] as T[];
}

/**
 * Execute multiple statements in a transaction.
 */
export async function transaction(
  operations: Array<{ sql: string; bindValues?: unknown[] }>
): Promise<void> {
  if (isTauriRuntime) {
    const database = await getDatabase();
    await database.execute('BEGIN TRANSACTION');
    try {
      for (const op of operations) {
        await database.execute(op.sql, op.bindValues ?? []);
      }
      await database.execute('COMMIT');
    } catch (error) {
      await database.execute('ROLLBACK');
      throw error;
    }
    return;
  }

  for (const op of operations) {
    await execute(op.sql, op.bindValues ?? []);
  }
}

/**
 * Get a single setting value by key.
 */
export async function getSetting(key: string): Promise<string | null> {
  const rows = await select<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [key]
  );
  return rows.length > 0 ? rows[0].value : null;
}

/**
 * Set a setting value.
 */
export async function setSetting(key: string, value: string): Promise<void> {
  await execute(
    `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [key, value]
  );
}

/**
 * Close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.close();
    db = null;
  }
}
