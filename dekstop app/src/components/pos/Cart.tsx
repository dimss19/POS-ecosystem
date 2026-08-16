import { useCartStore } from '../../stores/cartStore';
import { formatRupiah } from '../../utils/format';
import CartItemRow from './CartItem';
import { ShoppingCartIcon, CreditCardIcon } from '../icons';

interface CartProps {
  onCheckout: () => void;
}

export default function Cart({ onCheckout }: CartProps) {
  const { items, discount, increaseQuantity, decreaseQuantity, removeItem, clearCart, setDiscount, getSubtotal, getTotal, getItemCount } = useCartStore();

  const subtotal = getSubtotal();
  const total = getTotal();
  const itemCount = getItemCount();

  return (
    <div className="flex flex-col h-full bg-surface-900 border-l border-surface-700/80 shadow-xs">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-surface-700/80">
        <div className="flex items-center gap-2">
          <ShoppingCartIcon size={20} className="text-primary-600" />
          <h2 className="text-base font-bold text-surface-100">
            Keranjang
          </h2>
          {itemCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary-100 text-primary-700">
              {itemCount}
            </span>
          )}
        </div>
        {items.length > 0 && (
          <button
            id="cart-clear"
            type="button"
            onClick={clearCart}
            className="text-xs font-semibold text-danger-600 hover:text-danger-500 transition-colors"
          >
            Hapus semua
          </button>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-400 p-6 text-center">
            <ShoppingCartIcon size={44} className="mb-3 stroke-1 text-surface-400" />
            <p className="text-sm font-semibold text-surface-200">Keranjang masih kosong</p>
            <p className="text-xs text-surface-400 mt-1">Scan barcode atau klik produk untuk menambahkan item</p>
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
        <div className="border-t border-surface-700/80 p-4 space-y-3 bg-surface-950/40">
          {/* Subtotal */}
          <div className="flex justify-between text-sm">
            <span className="text-surface-400">Subtotal</span>
            <span className="text-surface-200 font-semibold">{formatRupiah(subtotal)}</span>
          </div>

          {/* Discount */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-surface-400">Diskon</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-surface-400">Rp</span>
              <input
                id="cart-discount"
                type="number"
                min="0"
                value={discount || ''}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-28 pl-7 pr-3 py-1.5 rounded-lg bg-surface-900 border border-surface-700 text-right text-surface-100 text-sm font-semibold outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20"
              />
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center pt-2.5 border-t border-surface-700/80">
            <span className="text-base font-bold text-surface-100">Total</span>
            <span className="text-2xl font-extrabold text-primary-600">
              {formatRupiah(total)}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            id="btn-checkout"
            type="button"
            onClick={onCheckout}
            className="w-full py-3.5 px-4 rounded-xl bg-success-600 hover:bg-success-500 text-white font-bold text-base transition-all duration-150 shadow-md active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <CreditCardIcon size={20} />
            <span>Bayar Sekarang</span>
          </button>
        </div>
      )}
    </div>
  );
}
