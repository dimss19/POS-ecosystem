/**
 * KASIR POS — Sync Engine Hook
 *
 * Automatically triggers synchronization:
 * - On app startup.
 * - On connectivity recovery (switching from offline to online).
 * - Periodically (every 5 minutes) when online.
 */

import { useEffect, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useSyncStore } from '../stores/syncStore';

export function useSyncEngine() {
  const { isOnline } = useNetworkStatus();
  const { triggerSync, loadSyncStats, isSyncing } = useSyncStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. App Startup Sync and Stats Load
  useEffect(() => {
    loadSyncStats();
    if (isOnline) {
      triggerSync(isOnline);
    }
  }, [loadSyncStats, triggerSync, isOnline]);

  // 2. Connectivity Recovery Sync
  const wasOffline = useRef(!isOnline);
  useEffect(() => {
    if (isOnline && wasOffline.current) {
      triggerSync(isOnline);
      wasOffline.current = false;
    } else if (!isOnline) {
      wasOffline.current = true;
    }
  }, [isOnline, triggerSync]);

  // 3. Periodic Sync Interval (5 Minutes = 300000ms)
  useEffect(() => {
    if (isOnline) {
      intervalRef.current = setInterval(() => {
        triggerSync(isOnline);
      }, 300000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isOnline, triggerSync]);

  return { isSyncing };
}
