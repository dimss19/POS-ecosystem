import type { CartItem } from '../../types';
import { formatRupiah } from '../../utils/format';
import { XIcon } from '../icons';

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
    <div className="flex items-center gap-2.5 py-3 px-4 border-b border-surface-700/60 last:border-0 hover:bg-surface-800/40 transition-colors animate-slide-right">
      {/* Product Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-surface-100 truncate">
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
          className="w-6 h-6 flex items-center justify-center rounded-md bg-surface-800 border border-surface-700/60 text-surface-300 hover:bg-surface-700 hover:text-surface-100 transition-colors text-xs font-bold"
          aria-label="Kurangi jumlah"
        >
          −
        </button>
        <span className="w-7 text-center text-xs font-bold text-surface-100">
          {item.quantity}
        </span>
        <button
          type="button"
          onClick={() => onIncrease(item.product_id)}
          className="w-6 h-6 flex items-center justify-center rounded-md bg-surface-800 border border-surface-700/60 text-surface-300 hover:bg-surface-700 hover:text-surface-100 transition-colors text-xs font-bold"
          aria-label="Tambah jumlah"
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <span className="w-20 text-right text-xs font-bold text-primary-600">
        {formatRupiah(item.subtotal)}
      </span>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(item.product_id)}
        className="w-6 h-6 flex items-center justify-center rounded-md text-surface-400 hover:bg-danger-50 hover:text-danger-600 transition-colors"
        aria-label="Hapus item"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
}
