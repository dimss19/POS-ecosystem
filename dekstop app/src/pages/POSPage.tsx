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
import { ClockIcon, AlertTriangleIcon } from '../components/icons';
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
        <div className="max-w-md w-full bg-surface-900 border border-surface-700/80 rounded-2xl p-8 text-center shadow-card animate-scale-in">
          <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mx-auto mb-4 border border-primary-200/50">
            <ClockIcon size={32} />
          </div>
          <h2 className="text-xl font-bold text-surface-100 mb-2">Shift Kasir Belum Dibuka</h2>
          <p className="text-surface-400 text-sm mb-6 leading-relaxed">
            Anda harus membuka shift baru dengan memasukkan modal kas awal sebelum dapat melakukan transaksi penjualan.
          </p>
          <button
            id="btn-goto-shift"
            type="button"
            onClick={() => navigate('/shift')}
            className="w-full py-3.5 px-4 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-600/20 active:scale-95 text-sm"
          >
            Buka Shift Sekarang
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-surface-950">
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
          <div className="mx-4 mt-2 px-4 py-2.5 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-xs font-semibold animate-fade-in flex items-center gap-2">
            <AlertTriangleIcon size={16} className="text-danger-600 shrink-0" />
            <span>{barcodeError}</span>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex items-center gap-2 px-4 py-3 overflow-x-auto">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategoryId === null
                ? 'bg-primary-600 text-white shadow-xs'
                : 'bg-surface-900 border border-surface-700/80 text-surface-300 hover:text-surface-100 hover:bg-surface-800'
            }`}
          >
            Semua
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategoryId === cat.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-surface-900 border border-surface-700/80 text-surface-300 hover:text-surface-100 hover:bg-surface-800'
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
