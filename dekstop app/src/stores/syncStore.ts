/**
 * KASIR POS — Sync Store (Zustand)
 *
 * Manages the state of the sync engine (pending item counts, syncing states, and logs).
 */

import { create } from 'zustand';
import * as syncService from '../services/sync';
import type { SyncQueueItem } from '../types';

interface SyncState {
  isSyncing: boolean;
  pendingCount: number;
  failedCount: number;
  syncingCount: number;
  syncedCount: number;
  lastSyncTime: string | null;
  failedItems: SyncQueueItem[];
  error: string | null;

  loadSyncStats: () => Promise<void>;
  registerDevice: () => Promise<boolean>;
  triggerSync: (isOnline: boolean) => Promise<void>;
  retryFailedItem: (id: number) => Promise<void>;
  retryAllFailedItems: () => Promise<void>;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  isSyncing: false,
  pendingCount: 0,
  failedCount: 0,
  syncingCount: 0,
  syncedCount: 0,
  lastSyncTime: null,
  failedItems: [],
  error: null,

  loadSyncStats: async () => {
    try {
      const stats = await syncService.getSyncStats();
      const failedItems = await syncService.getFailedSyncItems();
      set({
        pendingCount: stats.pending,
        syncingCount: stats.syncing,
        syncedCount: stats.synced,
        failedCount: stats.failed,
        failedItems
      });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Gagal memuat status sinkronisasi' });
    }
  },

  registerDevice: async () => {
    return await syncService.registerDevice();
  },

  triggerSync: async (isOnline: boolean) => {
    const { isSyncing } = get();
    if (isSyncing || !isOnline) return;

    set({ isSyncing: true, error: null });

    try {
      // 1. Register device first (safe to run repeatedly)
      await syncService.registerDevice();

      // 2. Process all pending sync items (Push Queue)
      let queue = await syncService.getPendingSyncQueue();
      while (queue.length > 0) {
        // Run sequentially to guarantee order
        for (const item of queue) {
          await syncService.processSyncItem(item);
        }
        // Check for any new items added during processing
        queue = await syncService.getPendingSyncQueue();
      }

      // 3. Pull latest categories and products (Pull Cache)
      const pullResult = await syncService.pullData();
      if (!pullResult.success) {
        set({ error: pullResult.message });
      }

      set({ lastSyncTime: new Date().toISOString() });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Terjadi kesalahan saat sinkronisasi' });
    } finally {
      set({ isSyncing: false });
      await get().loadSyncStats();
    }
  },

  retryFailedItem: async (id: number) => {
    set({ isSyncing: true });
    try {
      await syncService.resetFailedSyncItem(id);
      await get().loadSyncStats();
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Gagal mereset item sinkronisasi' });
    } finally {
      set({ isSyncing: false });
    }
  },

  retryAllFailedItems: async () => {
    set({ isSyncing: true });
    try {
      await syncService.resetAllFailedSyncItems();
      await get().loadSyncStats();
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Gagal mereset semua item sinkronisasi' });
    } finally {
      set({ isSyncing: false });
    }
  }
}));
