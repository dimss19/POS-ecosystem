import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncStore } from '../stores/syncStore';

export default function StatusBar() {
  const { isOnline } = useNetworkStatus();
  const { isSyncing, pendingCount, failedCount } = useSyncStore();

  const getSyncStatusText = () => {
    if (isSyncing) {
      return '🔄 Menyinkronkan data...';
    }
    if (failedCount > 0) {
      return `⚠ ${failedCount} unggahan gagal`;
    }
    if (pendingCount > 0) {
      return `⟳ ${pendingCount} tertunda`;
    }
    return '✓ Terkoneksi & Sinkron';
  };

  return (
    <footer className="flex items-center justify-between h-8 px-4 bg-surface-900 border-t border-surface-700/50 text-xs">
      {/* Left: Connection Status */}
      <div className="flex items-center gap-2">
        <span
          id="status-indicator"
          className={`inline-block w-2 h-2 rounded-full ${
            isOnline
              ? 'bg-success-400 animate-pulse-soft'
              : 'bg-danger-400'
          }`}
        />
        <span
          id="status-text"
          className={isOnline ? 'text-success-400' : 'text-danger-400 font-semibold'}
        >
          {isOnline ? 'Online' : 'OFFLINE'}
        </span>
      </div>

      {/* Center: Sync status */}
      <div id="sync-status" className={`font-medium ${
        failedCount > 0 
          ? 'text-danger-400 animate-pulse-soft' 
          : pendingCount > 0 
          ? 'text-warning-400' 
          : 'text-success-400'
      }`}>
        {getSyncStatusText()}
      </div>

      {/* Right: App version */}
      <div className="text-surface-500">
        KASIR POS v0.1.0
      </div>
    </footer>
  );
}
