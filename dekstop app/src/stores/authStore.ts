/**
 * KASIR POS — Auth Store (Zustand)
 *
 * Manages authentication state.
 * Token is stored in memory only (not localStorage).
 */

import { create } from 'zustand';
import type { User } from '../types';
import * as authService from '../services/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string): Promise<boolean> => {
    set({ isLoading: true, error: null });

    try {
      const result = await authService.login(email, password);

      if (result.success && result.user) {
        set({
          user: result.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      }

      set({
        isLoading: false,
        error: result.message,
      });
      return false;
    } catch {
      set({
        isLoading: false,
        error: 'Terjadi kesalahan saat login',
      });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    await authService.logout();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    // Redirect handled by ProtectedRoute
  },

  clearError: () => set({ error: null }),
}));
