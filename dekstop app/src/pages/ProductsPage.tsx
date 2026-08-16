import { useEffect, useState } from 'react';
import { useProductStore } from '../stores/productStore';
import * as inventoryService from '../services/inventory';
import { formatRupiah } from '../utils/format';
import { SearchIcon, PackageIcon, XIcon } from '../components/icons';
import type { Product } from '../types';

export default function ProductsPage() {
  const {
    products,
    categories,
    isLoading,
    selectedCategoryId,
    loadProducts,
    loadCategories,
    searchProducts,
    setCategory
  } = useProductStore();

  // Search & Filter state
  const [searchVal, setSearchVal] = useState('');

  // Adjustment Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStockVal, setNewStockVal] = useState<string>('');
  const [adjustmentNotes, setAdjustmentNotes] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState(false);

  useEffect(() => {
    loadProducts();
    loadCategories();
  }, [loadProducts, loadCategories]);

  const handleSearchChange = (val: string) => {
    setSearchVal(val);
    searchProducts(val);
  };

  const handleOpenAdjustment = (product: Product) => {
    setSelectedProduct(product);
    setNewStockVal(product.stock.toString());
    setAdjustmentNotes('');
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const newStock = Number(newStockVal);
    if (isNaN(newStock) || newStock < 0) {
      alert('Stok baru harus berupa angka positif!');
      return;
    }

    setIsAdjusting(true);
    try {
      await inventoryService.adjustStock(
        selectedProduct.id,
        selectedProduct.stock,
        newStock,
        adjustmentNotes
      );
      alert('Stok berhasil disesuaikan!');
      setSelectedProduct(null);
      await loadProducts(); // Reload products to refresh list stock
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menyesuaikan stok');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-950 p-6 space-y-5 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-surface-700/80 pb-4">
        <div>
          <h2 className="text-xl font-bold text-surface-100">Katalog & Stok Produk</h2>
          <p className="text-xs text-surface-400 mt-0.5">Daftar produk, kategori, dan penyesuaian stok lokal</p>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-surface-400">
            <SearchIcon size={18} />
          </span>
          <input
            type="text"
            value={searchVal}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari produk berdasarkan nama, SKU, atau barcode..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-900 border border-surface-700/80 text-surface-100 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none text-sm shadow-2xs font-medium"
          />
        </div>

        {/* Category Dropdown */}
        <select
          value={selectedCategoryId ?? ''}
          onChange={(e) => setCategory(Number(e.target.value) || null)}
          className="px-4 py-2.5 bg-surface-900 border border-surface-700/80 rounded-xl text-sm font-semibold text-surface-200 outline-none focus:border-primary-500 shadow-2xs"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-surface-900 border border-surface-700/80 rounded-2xl flex-1 flex flex-col overflow-hidden shadow-card">
        <div className="flex-1 overflow-auto">
          {isLoading && products.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <span className="inline-block w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-400 py-12">
              <PackageIcon size={44} className="mb-2 stroke-1 text-surface-400" />
              <p className="text-sm font-medium">Produk tidak ditemukan</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-surface-700/80 text-xs font-bold text-surface-400 uppercase tracking-wider bg-surface-950/60 sticky top-0 backdrop-blur-md">
                  <th className="px-6 py-3.5">Nama Produk</th>
                  <th className="px-6 py-3.5">SKU / Barcode</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5 text-right">Harga Jual</th>
                  <th className="px-6 py-3.5 text-center">Stok</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-700/60 text-sm">
                {products.map((p) => {
                  const isOutOfStock = p.stock <= 0;
                  const isLowStock = p.stock <= p.min_stock && p.stock > 0;
                  return (
                    <tr key={p.id} className="hover:bg-surface-800/40 transition-colors">
                      <td className="px-6 py-4 font-semibold text-surface-100">{p.name}</td>
                      <td className="px-6 py-4">
                        <span className="block text-xs font-mono text-surface-400">SKU: {p.sku || '-'}</span>
                        <span className="block text-xs font-mono text-surface-400">BC: {p.barcode || '-'}</span>
                      </td>
                      <td className="px-6 py-4 text-surface-400 font-medium">{p.category_name || '-'}</td>
                      <td className="px-6 py-4 text-right font-bold text-primary-600">{formatRupiah(p.price)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          isOutOfStock 
                            ? 'bg-danger-50 text-danger-700 border border-danger-200' 
                            : isLowStock 
                            ? 'bg-warning-50 text-warning-700 border border-warning-200' 
                            : 'bg-success-50 text-success-700 border border-success-200'
                        }`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleOpenAdjustment(p)}
                          className="px-3.5 py-1.5 bg-surface-900 border border-surface-700/80 hover:border-primary-500 hover:text-primary-600 text-xs font-bold text-surface-300 rounded-lg active:scale-95 transition-all shadow-2xs"
                        >
                          Sesuaikan Stok
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md bg-surface-900 border border-surface-700/80 rounded-2xl overflow-hidden shadow-modal animate-scale-in">
            <div className="px-6 py-4 border-b border-surface-700/80 flex justify-between items-center bg-surface-900">
              <h3 className="font-bold text-base text-surface-100">Penyesuaian Stok</h3>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
              >
                <XIcon size={18} />
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="p-6 space-y-4">
              <div>
                <span className="block text-xs text-surface-400 uppercase font-bold tracking-wider">Produk</span>
                <span className="font-bold text-sm text-surface-100 mt-0.5 block">{selectedProduct.name}</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-surface-400 uppercase font-bold tracking-wider mb-1.5">Stok Saat Ini</label>
                  <input
                    type="text"
                    value={selectedProduct.stock}
                    className="w-full px-3 py-2.5 bg-surface-800/60 border border-surface-700 rounded-xl text-sm text-surface-400 font-bold text-center select-none outline-none"
                    disabled
                  />
                </div>
                <div>
                  <label htmlFor="new-stock-input" className="block text-xs text-surface-400 uppercase font-bold tracking-wider mb-1.5">Stok Baru</label>
                  <input
                    id="new-stock-input"
                    type="text"
                    value={newStockVal}
                    onChange={(e) => setNewStockVal(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="w-full px-3 py-2.5 bg-surface-900 border border-surface-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 rounded-xl text-sm font-bold text-center text-surface-100 outline-none"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label htmlFor="adjust-notes-input" className="block text-xs text-surface-400 uppercase font-bold tracking-wider mb-1.5">Alasan / Catatan</label>
                <textarea
                  id="adjust-notes-input"
                  rows={3}
                  value={adjustmentNotes}
                  onChange={(e) => setAdjustmentNotes(e.target.value)}
                  placeholder="Contoh: Barang rusak, stock opname bulanan..."
                  className="w-full px-4 py-2.5 bg-surface-900 border border-surface-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 rounded-xl text-sm text-surface-100 outline-none resize-none font-medium"
                  required
                />
              </div>

              <div className="flex gap-3 border-t border-surface-700/80 pt-4 mt-2">
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="flex-1 py-2.5 bg-surface-800 hover:bg-surface-700 border border-surface-700 text-surface-200 font-bold rounded-xl text-sm transition-colors"
                  disabled={isAdjusting}
                >
                  Batal
                </button>
                <button
                  id="btn-adjust-confirm"
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl text-sm shadow-xs transition-all active:scale-95"
                  disabled={isAdjusting}
                >
                  {isAdjusting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
