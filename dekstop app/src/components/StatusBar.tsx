import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function StatusBar() {
  const { isOnline } = useNetworkStatus();

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

      {/* Center: Sync status placeholder */}
      <div id="sync-status" className="text-surface-400">
        {/* Will be populated by sync engine in Part 6 */}
      </div>

      {/* Right: App version */}
      <div className="text-surface-500">
        KASIR POS v0.1.0
      </div>
    </footer>
  );
}
