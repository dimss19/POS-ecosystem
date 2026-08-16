// ============================================================
// KASIR POS — Core Type Definitions
// ============================================================

// --- Product ---
export interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  min_stock: number;
  is_active: boolean;
  category_id: number | null;
  category_name?: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

// --- Category ---
export interface Category {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

// --- Cart ---
export interface CartItem {
  product_id: number;
  product_name: string;
  barcode: string;
  price: number;
  quantity: number;
  subtotal: number;
}

// --- Transaction ---
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'QRIS';
export type TransactionStatus = 'COMPLETED' | 'VOID';
export type SyncStatus = 'PENDING' | 'SYNCING' | 'SYNCED' | 'FAILED';

export interface Transaction {
  id: number;
  uuid: string;
  shift_id: number;
  cashier_id: number;
  cashier_name: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: PaymentMethod;
  amount_paid: number;
  change: number;
  status: TransactionStatus;
  sync_status: SyncStatus;
  device_id: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionItem {
  id: number;
  transaction_id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
  created_at: string;
}

// --- Stock Movement ---
export type StockMovementType = 'SALE' | 'ADJUSTMENT' | 'RETURN' | 'VOID_REVERSAL';

export interface StockMovement {
  id: number;
  product_id: number;
  type: StockMovementType;
  quantity: number;
  reference_id: string | null;
  notes: string | null;
  created_at: string;
}

// --- Shift ---
export type ShiftStatus = 'OPEN' | 'CLOSED';

export interface Shift {
  id: number;
  cashier_id: number;
  cashier_name: string;
  opening_cash: number;
  closing_cash: number | null;
  expected_cash: number | null;
  cash_sales: number;
  cash_refunds: number;
  status: ShiftStatus;
  sync_status: SyncStatus;
  device_id: string;
  opened_at: string;
  closed_at: string | null;
}

// --- Sync Queue ---
export type SyncOperation = 'CREATE' | 'UPDATE' | 'DELETE';

export interface SyncQueueItem {
  id: number;
  entity_type: string;
  entity_id: string;
  operation: SyncOperation;
  payload: string;
  status: SyncStatus;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

// --- Settings ---
export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// --- Device ---
export interface Device {
  id: number;
  device_id: string;
  name: string;
  registered_at: string;
}

// --- Auth ---
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  data: {
    user: User;
    token: string;
  };
  message: string;
}

// --- API Response ---
export interface ApiResponse<T> {
  data: T;
  message: string;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

// --- Navigation ---
export interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}
