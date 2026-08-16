/**
 * KASIR POS — Transaction Store (Zustand)
 *
 * Manages the state of transactions history.
 */

import { create } from 'zustand';
import type { Transaction, TransactionItem } from '../types';
import * as transactionService from '../services/transaction';

interface TransactionState {
  transactions: Transaction[];
  selectedTransactionItems: TransactionItem[];
  selectedTransactionId: number | null;
  isLoading: boolean;
  error: string | null;

  loadTransactions: () => Promise<void>;
  loadTransactionItems: (transactionId: number) => Promise<void>;
  createTransaction: (params: Parameters<typeof transactionService.createTransaction>[0]) => Promise<Transaction>;
  voidTransaction: (transactionId: number) => Promise<void>;
  clearSelection: () => void;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  selectedTransactionItems: [],
  selectedTransactionId: null,
  isLoading: false,
  error: null,

  loadTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const txs = await transactionService.getTransactions();
      set({ transactions: txs, isLoading: false });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal memuat transaksi';
      set({ error: errMsg, isLoading: false });
    }
  },

  loadTransactionItems: async (transactionId: number) => {
    set({ isLoading: true, error: null });
    try {
      const items = await transactionService.getTransactionItems(transactionId);
      set({ 
        selectedTransactionItems: items, 
        selectedTransactionId: transactionId, 
        isLoading: false 
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal memuat item transaksi';
      set({ error: errMsg, isLoading: false });
    }
  },

  createTransaction: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const tx = await transactionService.createTransaction(params);
      // Reload transaction history list
      const txs = await transactionService.getTransactions();
      set({ transactions: txs, isLoading: false });
      return tx;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal memproses pembayaran';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  voidTransaction: async (transactionId: number) => {
    set({ isLoading: true, error: null });
    try {
      await transactionService.voidTransaction(transactionId);
      // Reload transactions
      const txs = await transactionService.getTransactions();
      set({ transactions: txs, isLoading: false });
      
      // Reload current selected transaction details if it is the voided one
      const { selectedTransactionId } = get();
      if (selectedTransactionId === transactionId) {
        await get().loadTransactionItems(transactionId);
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Gagal membatalkan transaksi';
      set({ error: errMsg, isLoading: false });
      throw err;
    }
  },

  clearSelection: () => {
    set({ selectedTransactionId: null, selectedTransactionItems: [] });
  }
}));
