/**
 * KASIR POS — Product Service
 *
 * Local SQLite CRUD operations for products.
 * All queries use parameterized statements.
 */

import { select, execute } from './database';
import type { Product, Category } from '../types';

/**
 * Get all active products, optionally filtered by category.
 */
export async function getProducts(categoryId?: number): Promise<Product[]> {
  if (categoryId) {
    return select<Product>(
      `SELECT p.*, c.name as category_name
       FROM products p
       LEFT JOIN categories c ON c.id = p.category_id
       WHERE p.is_active = 1 AND p.category_id = ?
       ORDER BY p.name ASC`,
      [categoryId],
    );
  }

  return select<Product>(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = 1
     ORDER BY p.name ASC`,
  );
}

/**
 * Search products by name, SKU, or barcode.
 */
export async function searchProducts(query: string): Promise<Product[]> {
  const searchTerm = `%${query}%`;
  return select<Product>(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.is_active = 1
       AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)
     ORDER BY p.name ASC
     LIMIT 50`,
    [searchTerm, searchTerm, searchTerm],
  );
}

/**
 * Find a product by exact barcode match.
 */
export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  const rows = await select<Product>(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.barcode = ? AND p.is_active = 1
     LIMIT 1`,
    [barcode],
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get a product by ID.
 */
export async function getProductById(id: number): Promise<Product | null> {
  const rows = await select<Product>(
    `SELECT p.*, c.name as category_name
     FROM products p
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.id = ?
     LIMIT 1`,
    [id],
  );
  return rows.length > 0 ? rows[0] : null;
}

/**
 * Get all categories.
 */
export async function getCategories(): Promise<Category[]> {
  return select<Category>(
    'SELECT * FROM categories ORDER BY name ASC',
  );
}

/**
 * Update product stock locally.
 */
export async function updateProductStock(
  productId: number,
  newStock: number,
): Promise<void> {
  await execute(
    `UPDATE products SET stock = ?, updated_at = datetime('now') WHERE id = ?`,
    [newStock, productId],
  );
}

/**
 * Get product count.
 */
export async function getProductCount(): Promise<number> {
  const rows = await select<{ count: number }>(
    'SELECT COUNT(*) as count FROM products WHERE is_active = 1',
  );
  return rows[0]?.count ?? 0;
}
