/**
 * KASIR POS — Cart Component
 */

import { useCartStore } from '../../stores/cartStore';
import { formatRupiah } from '../../utils/format';
import CartItemRow from './CartItem';

interface CartProps {
  onCheckout: () => void;
}

export default function Cart({ onCheckout }: CartProps) {
  const { items, discount, increaseQuantity, decreaseQuantity, removeItem, clearCart, setDiscount, getSubtotal, getTotal, getItemCount } = useCartStore();

  const subtotal = getSubtotal();
  const total = getTotal();
  const itemCount = getItemCount();

  return (
    <div className="flex flex-col h-full bg-surface-900 border-l border-surface-700/50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-700/50">
        <h2 className="text-lg font-bold text-surface-100">
          Keranjang
          {itemCount > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-primary-600/30 text-primary-300">
              {itemCount}
            </span>
          )}
        </h2>
        {items.length > 0 && (
          <button
            id="cart-clear"
            type="button"
            onClick={clearCart}
            className="text-xs text-surface-400 hover:text-danger-400 transition-colors"
          >
            Hapus semua
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-400">
            <span className="text-4xl mb-3">🛒</span>
            <p className="text-sm">Keranjang kosong</p>
            <p className="text-xs mt-1">Scan barcode atau pilih produk</p>
          </div>
        ) : (
          items.map((item) => (
            <CartItemRow
              key={item.product_id}
              item={item}
              onIncrease={increaseQuantity}
              onDecrease={decreaseQuantity}
              onRemove={removeItem}
            />
          ))
        )}
      </div>

      {/* Summary & Checkout */}
      {items.length > 0 && (
        <div className="border-t border-surface-700/50 p-4 space-y-3">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-surface-400">Subtotal</span>
            <span className="text-surface-200">{formatRupiah(subtotal)}</span>
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-400">Diskon</span>
            <input
              id="cart-discount"
              type="number"
              min="0"
              value={discount || ''}
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              placeholder="0"
              className="w-28 px-3 py-1.5 rounded-lg bg-surface-800 border border-surface-600 text-right text-surface-200 text-sm outline-none focus:border-primary-500"
            />
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2 border-t border-surface-700/30">
            <span className="text-lg font-bold text-surface-100">Total</span>
            <span className="text-2xl font-bold text-primary-400">
              {formatRupiah(total)}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            id="btn-checkout"
            type="button"
            onClick={onCheckout}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-success-500 to-success-600 text-white font-bold text-lg hover:from-success-400 hover:to-success-500 transition-all duration-200 shadow-lg active:scale-[0.98]"
          >
            💳 Bayar
          </button>
        </div>
      )}
    </div>
  );
}
