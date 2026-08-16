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
import { useNavigate } from 'react-router-dom';
import { useProductStore } from '../stores/productStore';
import { useCartStore } from '../stores/cartStore';
import { useShiftStore } from '../stores/shiftStore';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import SearchBar from '../components/pos/SearchBar';
import ProductGrid from '../components/pos/ProductGrid';
import Cart from '../components/pos/Cart';
import CheckoutModal from '../components/checkout/CheckoutModal';
import type { Product } from '../types';

export default function POSPage() {
  const navigate = useNavigate();
  const { products, categories, isLoading, loadProducts, loadCategories, searchProducts, setCategory, selectedCategoryId, findByBarcode } = useProductStore();
  const { addItem } = useCartStore();
  const { activeShift, loadActiveShift } = useShiftStore();

  const [barcodeError, setBarcodeError] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadProducts();
    loadCategories();
    loadActiveShift();
  }, [loadProducts, loadCategories, loadActiveShift]);

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

  if (!activeShift && !isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-surface-950 p-6">
        <div className="max-w-md w-full bg-surface-900 border border-surface-700/50 rounded-2xl p-8 text-center shadow-card animate-scale-in">
          <div className="text-6xl mb-4">🕐</div>
          <h2 className="text-2xl font-bold text-surface-100 mb-2">Shift Aktif Belum Dibuka</h2>
          <p className="text-surface-400 text-sm mb-6">
            Anda harus membuka shift baru dengan memasukkan modal kas awal sebelum dapat menggunakan mesin kasir untuk penjualan.
          </p>
          <button
            id="btn-goto-shift"
            type="button"
            onClick={() => navigate('/shift')}
            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95"
          >
            Buka Shift Sekarang
          </button>
        </div>
      </div>
    );
  }

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
