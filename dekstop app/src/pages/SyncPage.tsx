/**
 * KASIR POS — Sync Dashboard Page
 *
 * View and manage database sync state, pending queue items,
 * manual sync triggers, and retry failed operations.
 */

import { useEffect } from 'react';
import { useSyncStore } from '../stores/syncStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { formatDate } from '../utils/format';

export default function SyncPage() {
  const { isOnline } = useNetworkStatus();
  const {
    isSyncing,
    pendingCount,
    failedCount,
    syncingCount,
    syncedCount,
    lastSyncTime,
    failedItems,
    error,
    loadSyncStats,
    triggerSync,
    retryFailedItem,
    retryAllFailedItems
  } = useSyncStore();

  useEffect(() => {
    loadSyncStats();
  }, [loadSyncStats]);

  const handleSyncNow = async () => {
    if (!isOnline) {
      alert('Aplikasi sedang OFFLINE. Silakan periksa koneksi internet Anda.');
      return;
    }
    await triggerSync(isOnline);
  };

  const handleRetryAll = async () => {
    if (!isOnline) {
      alert('Aplikasi sedang OFFLINE. Silakan periksa koneksi internet Anda.');
      return;
    }
    await retryAllFailedItems();
    await triggerSync(isOnline);
  };

  const handleRetrySingle = async (id: number) => {
    if (!isOnline) {
      alert('Aplikasi sedang OFFLINE. Silakan periksa koneksi internet Anda.');
      return;
    }
    await retryFailedItem(id);
    await triggerSync(isOnline);
  };

  return (
    <div className="flex flex-col h-full bg-surface-950 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-surface-700/50 pb-4">
        <div>
          <h2 className="text-xl font-bold text-surface-100">Sinkronisasi Data</h2>
          <p className="text-xs text-surface-400 mt-0.5">Sinkronisasi transaksi offline dan shift ke server pusat</p>
        </div>
        <button
          id="btn-sync-now"
          type="button"
          onClick={handleSyncNow}
          disabled={isSyncing || !isOnline}
          className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSyncing ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Menyinkronkan...
            </>
          ) : (
            '🔄 Sinkronisasi Sekarang'
          )}
        </button>
      </div>

      {/* Connection & General Status Banner */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${
        isOnline 
          ? 'bg-success-500/5 border-success-500/20 text-success-400' 
          : 'bg-danger-500/5 border-danger-500/20 text-danger-400'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${isOnline ? 'bg-success-400 animate-pulse-soft' : 'bg-danger-400'}`} />
          <div>
            <span className="font-bold text-sm">
              Status Perangkat: {isOnline ? 'Terhubung (Online)' : 'Terputus (OFFLINE)'}
            </span>
            <p className="text-xs text-surface-400 mt-0.5">
              {isOnline 
                ? 'Semua transaksi offline akan otomatis diunggah ke server.' 
                : 'Transaksi lokal disimpan dengan aman dan akan disinkronkan saat terhubung kembali.'}
            </p>
          </div>
        </div>
        {lastSyncTime && (
          <span className="text-xs text-surface-400">
            Terakhir Sinkron: <span className="font-medium text-surface-200">{formatDate(lastSyncTime)}</span>
          </span>
        )}
      </div>

      {/* Sync Queue Error message */}
      {error && (
        <div className="px-4 py-3 rounded-lg bg-danger-500/10 border border-danger-500/30 text-danger-400 text-sm">
          ⚠️ {error}
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pending */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">Antrean Tertunda</span>
          <span className="text-3xl font-extrabold text-warning-400 mt-2">{pendingCount}</span>
        </div>
        
        {/* Syncing */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">Sedang Diproses</span>
          <span className="text-3xl font-extrabold text-info-400 mt-2">{syncingCount}</span>
        </div>

        {/* Failed */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">Sinkronisasi Gagal</span>
          <span className="text-3xl font-extrabold text-danger-400 mt-2">{failedCount}</span>
        </div>

        {/* Synced */}
        <div className="bg-surface-900 border border-surface-800 rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-bold text-surface-400 uppercase tracking-wider font-sans">Berhasil Sinkron</span>
          <span className="text-3xl font-extrabold text-success-400 mt-2">{syncedCount}</span>
        </div>
      </div>

      {/* Sync Queue Failures / Detailed Logs */}
      <div className="bg-surface-900 border border-surface-800 rounded-xl flex-1 flex flex-col min-h-[300px]">
        <div className="px-6 py-4 border-b border-surface-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-base text-surface-100">Log Kegagalan Sinkronisasi</h3>
            <p className="text-xs text-surface-400 mt-0.5">Daftar unggah transaksi yang gagal dikirim ke server</p>
          </div>
          {failedCount > 0 && (
            <button
              id="btn-retry-all"
              type="button"
              onClick={handleRetryAll}
              disabled={isSyncing || !isOnline}
              className="px-4 py-2 bg-warning-600 hover:bg-warning-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95"
            >
              Ulangi Semua
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {failedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-surface-400 py-12">
              <span className="text-4xl mb-2">✓</span>
              <p className="text-sm">Tidak ada kegagalan sinkronisasi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-surface-800 text-xs font-bold text-surface-400 uppercase tracking-wider">
                    <th className="pb-3">Entitas</th>
                    <th className="pb-3">ID Dokumen</th>
                    <th className="pb-3">Kesalahan Server</th>
                    <th className="pb-3 text-center">Percobaan</th>
                    <th className="pb-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-800 text-sm">
                  {failedItems.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-800/20">
                      <td className="py-3 font-medium text-surface-200 capitalize">{item.entity_type}</td>
                      <td className="py-3 text-xs font-mono text-surface-300">{item.entity_id.substring(0, 8)}...</td>
                      <td className="py-3 text-xs text-danger-400 max-w-xs truncate" title={item.last_error || ''}>
                        {item.last_error || 'Koneksi terputus'}
                      </td>
                      <td className="py-3 text-center text-surface-300">{item.retry_count}</td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => handleRetrySingle(item.id)}
                          disabled={isSyncing || !isOnline}
                          className="px-3 py-1 bg-surface-800 hover:bg-surface-700 border border-surface-700 text-xs font-bold text-primary-400 rounded-lg disabled:opacity-50 transition-colors"
                        >
                          Ulangi
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
