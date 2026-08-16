/**
 * KASIR POS — SQLite Database Migrations
 *
 * All tables use parameterized queries exclusively (no string concatenation).
 * Schema follows PRD §11 requirements.
 */

export const MIGRATIONS: string[] = [
  // ============================================================
  // Migration 001: Core tables
  // ============================================================
  `CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER,
    name TEXT NOT NULL,
    sku TEXT NOT NULL DEFAULT '',
    barcode TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    category_id INTEGER,
    image_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (category_id) REFERENCES categories(id)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode)`,
  `CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)`,
  `CREATE INDEX IF NOT EXISTS idx_products_name ON products(name)`,
  `CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)`,

  `CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    server_id INTEGER,
    cashier_id INTEGER NOT NULL,
    cashier_name TEXT NOT NULL DEFAULT '',
    opening_cash REAL NOT NULL DEFAULT 0,
    closing_cash REAL,
    expected_cash REAL,
    cash_sales REAL NOT NULL DEFAULT 0,
    cash_refunds REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK(status IN ('OPEN', 'CLOSED')),
    sync_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(sync_status IN ('PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
    device_id TEXT NOT NULL DEFAULT '',
    opened_at TEXT NOT NULL DEFAULT (datetime('now')),
    closed_at TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    shift_id INTEGER NOT NULL,
    cashier_id INTEGER NOT NULL,
    cashier_name TEXT NOT NULL DEFAULT '',
    subtotal REAL NOT NULL DEFAULT 0,
    discount REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'CASH' CHECK(payment_method IN ('CASH', 'TRANSFER', 'QRIS')),
    amount_paid REAL NOT NULL DEFAULT 0,
    change REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK(status IN ('COMPLETED', 'VOID')),
    sync_status TEXT NOT NULL DEFAULT 'PENDING' CHECK(sync_status IN ('PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
    device_id TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (shift_id) REFERENCES shifts(id)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_transactions_uuid ON transactions(uuid)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_shift ON transactions(shift_id)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_sync_status ON transactions(sync_status)`,

  `CREATE TABLE IF NOT EXISTS transaction_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    transaction_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL DEFAULT '',
    price REAL NOT NULL DEFAULT 0,
    quantity INTEGER NOT NULL DEFAULT 1,
    subtotal REAL NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (transaction_id) REFERENCES transactions(id)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction ON transaction_items(transaction_id)`,

  `CREATE TABLE IF NOT EXISTS stock_movements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('SALE', 'ADJUSTMENT', 'RETURN', 'VOID_REVERSAL')),
    quantity INTEGER NOT NULL DEFAULT 0,
    reference_id TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (product_id) REFERENCES products(id)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)`,
  `CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(type)`,

  `CREATE TABLE IF NOT EXISTS sync_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL CHECK(operation IN ('CREATE', 'UPDATE', 'DELETE')),
    payload TEXT NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'SYNCING', 'SYNCED', 'FAILED')),
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status)`,
  `CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id)`,

  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL DEFAULT '',
    registered_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  // ============================================================
  // Default settings
  // ============================================================
  `INSERT OR IGNORE INTO settings (key, value) VALUES ('server_url', 'http://localhost:8000')`,
  `INSERT OR IGNORE INTO settings (key, value) VALUES ('printer_paper_size', '80')`,
  `INSERT OR IGNORE INTO settings (key, value) VALUES ('sync_interval_seconds', '300')`,
  `INSERT OR IGNORE INTO settings (key, value) VALUES ('store_name', 'KASIR POS')`,

  // ============================================================
  // Migration version tracking
  // ============================================================
  `CREATE TABLE IF NOT EXISTS _migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,

  `INSERT OR IGNORE INTO _migrations (version) VALUES (1)`,
];
