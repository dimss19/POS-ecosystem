/**
 * KASIR POS — Shift Store (Zustand)
 *
 * Manages the state of the active cashier shift and shift history.
 */

import { create } from 'zustand';
import type { Shift } from '../types';
import * as shiftService from '../services/shift';

interface ShiftState {
  activeShift: Shift | null;
  shifts: Shift[];
  isLoading: boolean;
  error: string | null;

  loadActiveShift: () => Promise<Shift | null>;
  loadShifts: () => Promise<void>;
  openShift: (cashierId: number, cashierName: string, openingCash: number) => Promise<Shift>;
  closeShift: (shiftId: number, actualCash: number) => Promise<void>;
  getActiveStats: (shiftId: number) => Promise<{ cashSales: number; expectedCash: number }>;
}

export const useShiftStore = create<ShiftState>((set) => ({
  activeShift: null,
  shifts: [],
  isLoading: false,
  error: null,

  loadActiveShift: async () => {
    set({ isLoading: true, error: null });
    try {
      const shift = await shiftService.getActiveShift();
      set({ activeShift: shift, isLoading: false });
      return shift;
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Gagal memuat shift aktif', isLoading: false });
      return null;
    }
  },

  loadShifts: async () => {
    set({ isLoading: true, error: null });
    try {
      const shifts = await shiftService.getShifts();
      set({ shifts, isLoading: false });
    } catch (err: unknown) {
      set({ error: err instanceof Error ? err.message : 'Gagal memuat riwayat shift', isLoading: false });
    }
  },

  openShift: async (cashierId, cashierName, openingCash) => {
    set({ isLoading: true, error: null });
    try {
      const shift = await shiftService.openShift(cashierId, cashierName, openingCash);
      set({ activeShift: shift, isLoading: false });
      return shift;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal membuka shift';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  closeShift: async (shiftId, actualCash) => {
    set({ isLoading: true, error: null });
    try {
      await shiftService.closeShift(shiftId, actualCash);
      set({ activeShift: null, isLoading: false });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal menutup shift';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  getActiveStats: async (shiftId: number) => {
    return await shiftService.getActiveShiftStats(shiftId);
  }
}));
