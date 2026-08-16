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
      className={`flex flex-col p-3.5 rounded-xl border text-left transition-all duration-150 ${
        isOutOfStock
          ? 'bg-surface-800/40 border-surface-700/40 opacity-60 cursor-not-allowed'
          : 'bg-surface-900 border-surface-700/80 hover:border-primary-400 hover:shadow-card active:scale-[0.98] cursor-pointer'
      }`}
    >
      {/* Product Name */}
      <h3 className="text-sm font-semibold text-surface-100 truncate w-full">
        {product.name}
      </h3>

      {/* SKU / Barcode */}
      {product.sku && (
        <span className="text-xs font-mono text-surface-400 mt-0.5 truncate w-full">
          {product.sku}
        </span>
      )}

      {/* Price */}
      <span className="text-sm font-bold text-primary-600 mt-2">
        {formatRupiah(product.price)}
      </span>

      {/* Stock */}
      <div className="mt-1">
        {isOutOfStock ? (
          <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold bg-danger-50 text-danger-600 border border-danger-200/50">
            Stok habis
          </span>
        ) : isLowStock ? (
          <span className="inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold bg-warning-50 text-warning-600 border border-warning-200/50">
            Stok: {product.stock} (menipis)
          </span>
        ) : (
          <span className="text-xs text-surface-400">
            Stok: {product.stock}
          </span>
        )}
      </div>
    </button>
  );
}
