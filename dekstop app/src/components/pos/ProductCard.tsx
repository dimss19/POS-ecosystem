/**
 * KASIR POS — Product Card
 */

import type { Product } from '../../types';
import { formatRupiah } from '../../utils/format';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export default function ProductCard({ product, onAdd }: ProductCardProps) {
  const isLowStock = product.stock <= product.min_stock && product.stock > 0;
  const isOutOfStock = product.stock <= 0;

  return (
    <button
      id={`product-${product.id}`}
      type="button"
      onClick={() => !isOutOfStock && onAdd(product)}
      disabled={isOutOfStock}
      className={`flex flex-col p-3 rounded-xl border text-left transition-all duration-200 ${
        isOutOfStock
          ? 'bg-surface-800/50 border-surface-700/30 opacity-50 cursor-not-allowed'
          : 'bg-surface-800 border-surface-700/50 hover:border-primary-500/50 hover:shadow-card-hover active:scale-[0.98] cursor-pointer'
      }`}
    >
      {/* Product Name */}
      <h3 className="text-sm font-medium text-surface-100 truncate w-full">
        {product.name}
      </h3>

      {/* SKU */}
      {product.sku && (
        <span className="text-xs text-surface-500 mt-0.5 truncate w-full">
          {product.sku}
        </span>
      )}

      {/* Price */}
      <span className="text-sm font-bold text-primary-400 mt-2">
        {formatRupiah(product.price)}
      </span>

      {/* Stock */}
      <span
        className={`text-xs mt-1 ${
          isOutOfStock
            ? 'text-danger-400'
            : isLowStock
            ? 'text-warning-400'
            : 'text-surface-400'
        }`}
      >
        {isOutOfStock
          ? 'Stok habis'
          : isLowStock
          ? `Stok: ${product.stock} (rendah)`
          : `Stok: ${product.stock}`}
      </span>
    </button>
  );
}
