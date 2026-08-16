/**
 * KASIR POS — Transactions History Page
 *
 * View previous transactions, transaction items, and perform voids.
 */

import { useEffect } from 'react';
import { useTransactionStore } from '../stores/transactionStore';
import { useProductStore } from '../stores/productStore';
import { formatRupiah, formatDate, shortId } from '../utils/format';
import { printReceipt } from '../services/printer';

export default function TransactionsPage() {
  const {
    transactions,
    selectedTransactionItems,
    selectedTransactionId,
    isLoading,
    error,
    loadTransactions,
    loadTransactionItems,
    voidTransaction,
    clearSelection
  } = useTransactionStore();

  const { loadProducts } = useProductStore();

  useEffect(() => {
    loadTransactions();
    return () => {
      clearSelection();
    };
  }, [loadTransactions, clearSelection]);

  const handleTransactionSelect = (id: number) => {
    loadTransactionItems(id);
  };

  const handleVoid = async (id: number) => {
    const confirmVoid = window.confirm('Apakah Anda yakin ingin membatalkan transaksi ini? Stok produk akan dikembalikan.');
    if (!confirmVoid) return;

    try {
      await voidTransaction(id);
      // Reload products to refresh stock count in POS view
      await loadProducts();
      alert('Transaksi berhasil dibatalkan');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal membatalkan transaksi');
    }
  };

  const selectedTx = transactions.find(t => t.id === selectedTransactionId);

  return (
    <div className="flex h-full animate-fade-in">
      {/* Left Panel — Transaction List */}
      <div className="flex flex-col w-1/2 border-r border-surface-700/50 h-full bg-surface-950">
        <div className="px-6 py-4 border-b border-surface-700/50">
          <h2 className="text-lg font-bold text-surface-100">Riwayat Transaksi</h2>
          <p className="text-xs text-surface-400 mt-0.5">Daftar transaksi yang disimpan secara lokal</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading && transactions.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-surface-900 border border-surface-700/30 animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-surface-400">
              <span className="text-4xl mb-3">📋</span>
              <p className="text-sm">Belum ada transaksi</p>
            </div>
          ) : (
            transactions.map((tx) => {
              const isSelected = tx.id === selectedTransactionId;
              const isVoided = tx.status === 'VOID';
              return (
                <button
                  key={tx.id}
                  id={`tx-row-${tx.id}`}
                  type="button"
                  onClick={() => handleTransactionSelect(tx.id)}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-600/10'
                      : 'border-surface-800 bg-surface-900 hover:border-surface-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-sm text-surface-100">
                        {shortId(tx.uuid)}
                      </span>
                      <span className="text-xs text-surface-400 block mt-0.5">
                        {formatDate(tx.created_at)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-sm text-primary-400">
                        {formatRupiah(tx.total)}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1 justify-end">
                        {/* Status Badge */}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          isVoided 
                            ? 'bg-danger-500/20 text-danger-400 border border-danger-500/30' 
                            : 'bg-success-500/20 text-success-400 border border-success-500/30'
                        }`}>
                          {tx.status}
                        </span>

                        {/* Sync Status Badge */}
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          tx.sync_status === 'SYNCED'
                            ? 'bg-success-500/10 text-success-300'
                            : tx.sync_status === 'FAILED'
                            ? 'bg-danger-500/10 text-danger-300'
                            : 'bg-warning-500/10 text-warning-300'
                        }`}>
                          {tx.sync_status === 'SYNCED' ? '✓ Synced' : tx.sync_status === 'FAILED' ? '⚠ Failed' : '⟳ Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Panel — Transaction Details */}
      <div className="flex-1 flex flex-col h-full bg-surface-900">
        {selectedTx ? (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Detail Header */}
            <div className="px-6 py-4 border-b border-surface-700/50 flex justify-between items-center bg-surface-950">
              <div>
                <h3 className="font-bold text-base text-surface-100">
                  Detail {shortId(selectedTx.uuid)}
                </h3>
                <p className="text-xs text-surface-400 mt-0.5">
                  Kasir: {selectedTx.cashier_name}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  id="btn-print"
                  type="button"
                  onClick={() => printReceipt(selectedTx, selectedTransactionItems)}
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  Cetak Struk
                </button>
                {selectedTx.status !== 'VOID' && (
                  <button
                    id="btn-void"
                    type="button"
                    onClick={() => handleVoid(selectedTx.id)}
                    className="px-4 py-2 rounded-xl bg-danger-600 hover:bg-danger-500 text-white text-xs font-bold transition-all shadow-md active:scale-95"
                  >
                    Pembatalan (Void)
                  </button>
                )}
              </div>
            </div>

            {/* Item List */}
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-700 text-xs font-bold text-surface-400 uppercase tracking-wider">
                    <th className="pb-3">Produk</th>
                    <th className="pb-3 text-center">Qty</th>
                    <th className="pb-3 text-right">Harga</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800">
                  {selectedTransactionItems.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="py-3 font-medium text-surface-200">{item.product_name}</td>
                      <td className="py-3 text-center text-surface-300">{item.quantity}</td>
                      <td className="py-3 text-right text-surface-300">{formatRupiah(item.price)}</td>
                      <td className="py-3 text-right font-semibold text-primary-400">{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary */}
            <div className="border-t border-surface-700/50 p-6 bg-surface-950 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Subtotal</span>
                <span className="text-surface-200">{formatRupiah(selectedTx.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Diskon</span>
                <span className="text-danger-400">-{formatRupiah(selectedTx.discount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-surface-800">
                <span className="text-base font-bold text-surface-100">Total</span>
                <span className="text-xl font-bold text-primary-400">{formatRupiah(selectedTx.total)}</span>
              </div>

              {/* Payment Details */}
              <div className="pt-4 border-t border-surface-800 grid grid-cols-3 gap-4 text-center">
                <div className="bg-surface-900 rounded-lg p-2.5">
                  <span className="block text-[10px] text-surface-400 font-bold uppercase">Metode</span>
                  <span className="font-semibold text-sm text-surface-200">{selectedTx.payment_method}</span>
                </div>
                <div className="bg-surface-900 rounded-lg p-2.5">
                  <span className="block text-[10px] text-surface-400 font-bold uppercase">Bayar</span>
                  <span className="font-semibold text-sm text-surface-200">{formatRupiah(selectedTx.amount_paid)}</span>
                </div>
                <div className="bg-surface-900 rounded-lg p-2.5">
                  <span className="block text-[10px] text-surface-400 font-bold uppercase">Kembalian</span>
                  <span className="font-semibold text-sm text-success-400">{formatRupiah(selectedTx.change)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-surface-400">
            <span className="text-5xl mb-3">📄</span>
            <p className="text-sm">Pilih transaksi untuk melihat detail</p>
          </div>
        )}
      </div>
    </div>
  );
}
