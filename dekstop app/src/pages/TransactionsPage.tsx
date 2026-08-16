import { useEffect } from 'react';
import { useTransactionStore } from '../stores/transactionStore';
import { useProductStore } from '../stores/productStore';
import { formatRupiah, formatDate, shortId } from '../utils/format';
import { printReceipt } from '../services/printer';
import {
  ReceiptIcon,
  FileTextIcon,
  CheckIcon,
  AlertTriangleIcon,
  RefreshIcon,
} from '../components/icons';

export default function TransactionsPage() {
  const {
    transactions,
    selectedTransactionItems,
    selectedTransactionId,
    isLoading,
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
    <div className="flex h-full animate-fade-in bg-surface-950">
      {/* Left Panel — Transaction List */}
      <div className="flex flex-col w-1/2 border-r border-surface-700/80 h-full bg-surface-950">
        <div className="px-6 py-4 border-b border-surface-700/80 bg-surface-900">
          <h2 className="text-base font-bold text-surface-100">Riwayat Transaksi</h2>
          <p className="text-xs text-surface-400 mt-0.5">Daftar transaksi yang disimpan secara lokal</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading && transactions.length === 0 ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-20 rounded-xl bg-surface-900 border border-surface-700/50 animate-pulse" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-surface-400">
              <ReceiptIcon size={40} className="mb-2 stroke-1 text-surface-400" />
              <p className="text-sm font-medium">Belum ada transaksi</p>
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
                      ? 'border-primary-500 bg-primary-50/70 shadow-xs'
                      : 'border-surface-700/80 bg-surface-900 hover:border-surface-600 hover:shadow-2xs'
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
                      <span className="font-bold text-sm text-primary-600">
                        {formatRupiah(tx.total)}
                      </span>
                      <div className="flex items-center gap-1.5 mt-1.5 justify-end">
                        {/* Status Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isVoided 
                            ? 'bg-danger-50 text-danger-700 border border-danger-200' 
                            : 'bg-success-50 text-success-700 border border-success-200'
                        }`}>
                          {tx.status}
                        </span>

                        {/* Sync Status Badge */}
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 ${
                          tx.sync_status === 'SYNCED'
                            ? 'bg-success-50 text-success-700 border border-success-200'
                            : tx.sync_status === 'FAILED'
                            ? 'bg-danger-50 text-danger-700 border border-danger-200'
                            : 'bg-warning-50 text-warning-700 border border-warning-200'
                        }`}>
                          {tx.sync_status === 'SYNCED' ? (
                            <>
                              <CheckIcon size={11} />
                              Synced
                            </>
                          ) : tx.sync_status === 'FAILED' ? (
                            <>
                              <AlertTriangleIcon size={11} />
                              Failed
                            </>
                          ) : (
                            <>
                              <RefreshIcon size={11} />
                              Pending
                            </>
                          )}
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
            <div className="px-6 py-4 border-b border-surface-700/80 flex justify-between items-center bg-surface-900">
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
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
                >
                  Cetak Struk
                </button>
                {selectedTx.status !== 'VOID' && (
                  <button
                    id="btn-void"
                    type="button"
                    onClick={() => handleVoid(selectedTx.id)}
                    className="px-4 py-2 rounded-xl bg-danger-600 hover:bg-danger-500 text-white text-xs font-bold transition-all shadow-xs active:scale-95"
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
                  <tr className="border-b border-surface-700/80 text-xs font-bold text-surface-400 uppercase tracking-wider">
                    <th className="pb-3">Produk</th>
                    <th className="pb-3 text-center">Qty</th>
                    <th className="pb-3 text-right">Harga</th>
                    <th className="pb-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-700/60">
                  {selectedTransactionItems.map((item) => (
                    <tr key={item.id} className="text-sm">
                      <td className="py-3 font-medium text-surface-200">{item.product_name}</td>
                      <td className="py-3 text-center text-surface-300 font-semibold">{item.quantity}</td>
                      <td className="py-3 text-right text-surface-300">{formatRupiah(item.price)}</td>
                      <td className="py-3 text-right font-bold text-primary-600">{formatRupiah(item.subtotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculations Summary */}
            <div className="border-t border-surface-700/80 p-6 bg-surface-950 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Subtotal</span>
                <span className="text-surface-200 font-semibold">{formatRupiah(selectedTx.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-surface-400">Diskon</span>
                <span className="text-danger-600 font-semibold">-{formatRupiah(selectedTx.discount)}</span>
              </div>
              <div className="flex justify-between items-center pt-2.5 border-t border-surface-700/80">
                <span className="text-base font-bold text-surface-100">Total</span>
                <span className="text-xl font-bold text-primary-600">{formatRupiah(selectedTx.total)}</span>
              </div>

              {/* Payment Details */}
              <div className="pt-4 border-t border-surface-700/80 grid grid-cols-3 gap-3 text-center">
                <div className="bg-surface-900 border border-surface-700/80 rounded-xl p-2.5 shadow-2xs">
                  <span className="block text-[10px] text-surface-400 font-bold uppercase">Metode</span>
                  <span className="font-bold text-sm text-surface-100">{selectedTx.payment_method}</span>
                </div>
                <div className="bg-surface-900 border border-surface-700/80 rounded-xl p-2.5 shadow-2xs">
                  <span className="block text-[10px] text-surface-400 font-bold uppercase">Bayar</span>
                  <span className="font-bold text-sm text-surface-100">{formatRupiah(selectedTx.amount_paid)}</span>
                </div>
                <div className="bg-surface-900 border border-surface-700/80 rounded-xl p-2.5 shadow-2xs">
                  <span className="block text-[10px] text-surface-400 font-bold uppercase">Kembalian</span>
                  <span className="font-bold text-sm text-success-600">{formatRupiah(selectedTx.change)}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-surface-400 p-6 text-center">
            <FileTextIcon size={44} className="mb-3 stroke-1 text-surface-400" />
            <p className="text-sm font-semibold text-surface-200">Pilih transaksi untuk melihat detail</p>
            <p className="text-xs text-surface-400 mt-1">Klik salah satu baris transaksi di sebelah kiri</p>
          </div>
        )}
      </div>
    </div>
  );
}
