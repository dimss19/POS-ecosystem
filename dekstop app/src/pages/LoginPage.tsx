/**
 * KASIR POS — Login Page
 *
 * Clean login form with offline indicator.
 * Supports both online and offline authentication.
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  const { isOnline } = useNetworkStatus();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email.trim() || !password.trim()) return;

    const success = await login(email.trim(), password);
    if (success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-950">
      <div className="w-full max-w-md mx-4 animate-scale-in">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 mb-4 shadow-glow">
            <span className="text-4xl font-bold text-white">K</span>
          </div>
          <h1 className="text-3xl font-bold text-surface-100">KASIR POS</h1>
          <p className="text-surface-400 mt-1">Masuk ke akun Anda</p>
        </div>

        {/* Offline Badge */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-2 mb-4 rounded-lg bg-warning-500/10 border border-warning-500/30 text-warning-400 text-sm">
            <span className="inline-block w-2 h-2 rounded-full bg-warning-400" />
            <span>Mode Offline — Login menggunakan data cache</span>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-surface-900 rounded-2xl border border-surface-700/50 p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-sm font-medium text-surface-300 mb-2"
              >
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@contoh.com"
                className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-600 text-surface-100 placeholder-surface-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                disabled={isLoading}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-sm font-medium text-surface-300 mb-2"
              >
                Password
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-surface-800 border border-surface-600 text-surface-100 placeholder-surface-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 rounded-lg bg-danger-500/10 border border-danger-500/30 text-danger-400 text-sm animate-fade-in">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold text-lg hover:from-primary-500 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-glow active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Masuk...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-surface-500 text-xs mt-6">
          KASIR POS Desktop v0.1.0
        </p>
      </div>
    </div>
  );
}
