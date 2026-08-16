import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSyncStore } from '../stores/syncStore';
import { SyncIcon, AlertTriangleIcon, RefreshIcon, CheckIcon } from './icons';

export default function StatusBar() {
  const { isOnline } = useNetworkStatus();
  const { isSyncing, pendingCount, failedCount } = useSyncStore();

  const renderSyncStatus = () => {
    if (isSyncing) {
      return (
        <span className="flex items-center gap-1.5 text-primary-600 font-medium">
          <SyncIcon size={14} className="animate-spin" />
          Menyinkronkan data...
        </span>
      );
    }
    if (failedCount > 0) {
      return (
        <span className="flex items-center gap-1.5 text-danger-500 font-medium animate-pulse-soft">
          <AlertTriangleIcon size={14} />
          {failedCount} unggahan gagal
        </span>
      );
    }
    if (pendingCount > 0) {
      return (
        <span className="flex items-center gap-1.5 text-warning-600 font-medium">
          <RefreshIcon size={14} />
          {pendingCount} tertunda
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-success-600 font-medium">
        <CheckIcon size={14} />
        Terkoneksi & Sinkron
      </span>
    );
  };

  return (
    <footer className="flex items-center justify-between h-8 px-4 bg-surface-900 border-t border-surface-700/80 text-xs">
      {/* Left: Connection Status */}
      <div className="flex items-center gap-2">
        <span
          id="status-indicator"
          className={`inline-block w-2 h-2 rounded-full ${
            isOnline
              ? 'bg-success-500'
              : 'bg-danger-500'
          }`}
        />
        <span
          id="status-text"
          className={isOnline ? 'text-success-600 font-medium' : 'text-danger-600 font-semibold'}
        >
          {isOnline ? 'Online' : 'OFFLINE'}
        </span>
      </div>

      {/* Center: Sync status */}
      <div id="sync-status">
        {renderSyncStatus()}
      </div>

      {/* Right: App version */}
      <div className="text-surface-400 font-medium">
        KASIR POS v0.1.0
      </div>
    </footer>
  );
}
