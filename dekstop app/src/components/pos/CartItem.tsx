/**
 * KASIR POS — Cart Item Row
 */

import type { CartItem } from '../../types';
import { formatRupiah } from '../../utils/format';

interface CartItemRowProps {
  item: CartItem;
  onIncrease: (productId: number) => void;
  onDecrease: (productId: number) => void;
  onRemove: (productId: number) => void;
}

export default function CartItemRow({
  item,
  onIncrease,
  onDecrease,
  onRemove,
}: CartItemRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 px-4 border-b border-surface-700/30 last:border-0 animate-slide-right">
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-surface-100 truncate">
          {item.product_name}
        </h4>
        <span className="text-xs text-surface-400">
          {formatRupiah(item.price)} × {item.quantity}
        </span>
      </div>

      {/* Quantity Controls */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onDecrease(item.product_id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-700 text-surface-300 hover:bg-surface-600 transition-colors text-sm font-bold"
          aria-label="Kurangi jumlah"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-semibold text-surface-100">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onIncrease(item.product_id)}
          className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-700 text-surface-300 hover:bg-surface-600 transition-colors text-sm font-bold"
          aria-label="Tambah jumlah"
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <span className="w-24 text-right text-sm font-semibold text-primary-400">
        {formatRupiah(item.subtotal)}
      </span>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(item.product_id)}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-surface-500 hover:bg-danger-500/20 hover:text-danger-400 transition-colors"
        aria-label="Hapus item"
      >
        ✕
      </button>
    </div>
  );
}
