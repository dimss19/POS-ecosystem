/**
 * KASIR POS — Database Service
 *
 * Provides typed access to the local SQLite database via Tauri SQL plugin.
 * All queries use parameterized statements — never string concatenation.
 *
 * Security:
 * - All user inputs are passed as bind parameters (SQL injection prevention)
 * - No raw SQL interpolation anywhere
 */

import Database from '@tauri-apps/plugin-sql';
import { MIGRATIONS } from './migrations';

// Singleton database instance
let db: Database | null = null;

/**
 * Get or initialize the database connection.
 * Runs migrations on first connection.
 */
export async function getDatabase(): Promise<Database> {
  if (db) return db;

  db = await Database.load('sqlite:kasir_pos.db');
  await runMigrations(db);
  return db;
}

/**
 * Run all pending migrations.
 */
async function runMigrations(database: Database): Promise<void> {
  // Enable WAL mode for better concurrent read/write performance
  await database.execute('PRAGMA journal_mode=WAL');
  // Enable foreign key enforcement
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
  const database = await getDatabase();
  const result = await database.execute(sql, bindValues);
  return {
    rowsAffected: result.rowsAffected,
    lastInsertId: result.lastInsertId ?? 0,
  };
}

/**
 * Execute a parameterized SELECT query.
 * Returns an array of typed rows.
 */
export async function select<T>(
  sql: string,
  bindValues: unknown[] = []
): Promise<T[]> {
  const database = await getDatabase();
  return await database.select<T[]>(sql, bindValues);
}

/**
 * Execute multiple statements in a transaction.
 * Automatically rolls back on error.
 */
export async function transaction(
  operations: Array<{ sql: string; bindValues?: unknown[] }>
): Promise<void> {
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
