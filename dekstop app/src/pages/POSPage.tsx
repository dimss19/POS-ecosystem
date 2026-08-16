/**
 * KASIR POS — Main POS (Kasir) Page
 *
 * Primary cashier screen with:
 * - Search bar + barcode input (left panel)
 * - Category filter (left panel)
 * - Product grid (left panel)
 * - Cart (right panel)
 */

import { useEffect, useCallback, useState } from 'react';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import SearchBar from '../components/pos/SearchBar';
import ProductGrid from '../components/pos/ProductGrid';
import Cart from '../components/pos/Cart';
import CheckoutModal from '../components/checkout/CheckoutModal';
import type { Product } from '../types';

export default function POSPage() {
  const { products, categories, isLoading, loadProducts, loadCategories, searchProducts, setCategory, selectedCategoryId, findByBarcode } = useProductStore();
  const { addItem } = useCartStore();
  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  // Handle barcode scan from HID scanner
  const handleBarcodeScan = useCallback(
    async (barcode: string) => {
      setBarcodeError(null);
      const product = await findByBarcode(barcode);
      if (product) {
        addItem({
          product_id: product.id,
          product_name: product.name,
          barcode: product.barcode,
          price: product.price,
          stock: product.stock,
        });
      } else {
        setBarcodeError(`Produk dengan barcode "${barcode}" tidak ditemukan`);
        setTimeout(() => setBarcodeError(null), 3000);
      }
    },
    [findByBarcode, addItem],
  );

  // Register barcode scanner
  useBarcodeScanner({
    onBarcodeScanned: handleBarcodeScan,
    enabled: true,
  });

  // Add product to cart
  const handleAddToCart = (product: Product) => {
    addItem({
      product_id: product.id,
      product_name: product.name,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
    });
  };

  const handleCheckout = () => {
    setIsCheckoutOpen(true);
  };

  return (
    <div className="flex h-full">
      {/* Left Panel — Products */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Search Bar */}
        <div className="p-4 pb-0">
          <SearchBar
            onSearch={searchProducts}
            onBarcodeSubmit={handleBarcodeScan}
          />
        </div>

        {/* Barcode Error */}
        {barcodeError && (
          <div className="mx-4 mt-2 px-4 py-2 rounded-lg bg-danger-500/10 border border-danger-500/30 text-danger-400 text-sm animate-fade-in">
            {barcodeError}
          </div>
        )}

        {/* Category Filter */}
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategoryId === null
                ? 'bg-primary-600 text-white'
                : 'bg-surface-800 text-surface-400 hover:text-surface-200'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategoryId === cat.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface-800 text-surface-400 hover:text-surface-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          <ProductGrid
            products={products}
            isLoading={isLoading}
            onAddToCart={handleAddToCart}
          />
        </div>
      </div>

      {/* Right Panel — Cart */}
      <div className="w-96 shrink-0">
        <Cart onCheckout={handleCheckout} />
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={() => {
          loadProducts(); // Refresh stock in UI
        }}
      />
    </div>
  );
}
