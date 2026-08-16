import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { AlertTriangleIcon, StoreIcon } from '../components/icons';

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
    <div className="flex items-center justify-center min-h-screen bg-surface-950 p-4">
      <div className="w-full max-w-md animate-scale-in">
        {/* Logo & Title matching Mobile App */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-18 h-18 rounded-3xl bg-primary-500 text-white mb-4 shadow-md shadow-primary-500/25">
            <StoreIcon size={38} />
          </div>
          <h1 className="text-2xl font-extrabold text-surface-100 tracking-tight">KASIR POS</h1>
          <p className="text-surface-400 text-sm mt-1">Masuk untuk memulai transaksi kasir & shift</p>
        </div>

        {/* Offline Badge */}
        {!isOnline && (
          <div className="flex items-center gap-2 px-4 py-2.5 mb-4 rounded-xl bg-warning-50 border border-warning-200 text-warning-700 text-xs font-semibold">
            <AlertTriangleIcon size={16} className="text-warning-600 shrink-0" />
            <span>Mode Offline — Login menggunakan akun lokal ter-cache</span>
          </div>
        )}

        {/* Login Form */}
        <div className="bg-surface-900 rounded-2xl border border-surface-700 p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="login-email"
                className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-2"
              >
                Email / Username
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@toko.com"
                className="w-full px-4 py-3 rounded-xl bg-surface-800/60 border border-surface-700 text-surface-100 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none transition-all text-sm font-medium"
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
                className="block text-xs font-bold text-surface-300 uppercase tracking-wider mb-2"
              >
                Kata Sandi
              </label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-surface-800/60 border border-surface-700 text-surface-100 placeholder-surface-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 outline-none transition-all text-sm font-medium"
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-xs font-semibold animate-fade-in flex items-center gap-2">
                <AlertTriangleIcon size={16} className="text-danger-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={isLoading || !email.trim() || !password.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-md shadow-primary-500/20 active:scale-[0.98]"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memverifikasi Akun...
                </span>
              ) : (
                'Masuk ke Kasir'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-surface-400 text-xs mt-6 font-medium">
          KASIR POS Desktop v0.1.0 · Terhubung dengan Mobile Owner App
        </p>
      </div>
    </div>
  );
}
