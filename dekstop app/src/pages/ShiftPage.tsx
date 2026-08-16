import { useEffect, useState } from 'react';
import { useShiftStore } from '../stores/shiftStore';
import { useAuthStore } from '../stores/authStore';
import { formatRupiah, formatDate } from '../utils/format';
import { ClockIcon, AlertTriangleIcon } from '../components/icons';

export default function ShiftPage() {
  const { user } = useAuthStore();
  const {
    activeShift,
    shifts,
    isLoading,
    error,
    loadActiveShift,
    loadShifts,
    openShift,
    closeShift,
    getActiveStats
  } = useShiftStore();

  // Open Shift Form State
  const [openingCashInput, setOpeningCashInput] = useState<string>('');

  // Close Shift Form State
  const [actualCashInput, setActualCashInput] = useState<string>('');
  const [activeStats, setActiveStats] = useState<{ cashSales: number; expectedCash: number } | null>(null);

  // Load shift details on mount
  useEffect(() => {
    loadActiveShift();
    loadShifts();
  }, [loadActiveShift, loadShifts]);

  // Load stats dynamically when active shift changes or on periodic interval
  useEffect(() => {
    if (activeShift) {
      const fetchStats = async () => {
        const stats = await getActiveStats(activeShift.id);
        setActiveStats(stats);
      };
      fetchStats();
    } else {
      setActiveStats(null);
    }
  }, [activeShift, getActiveStats]);

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const cash = Number(openingCashInput) || 0;
    
    try {
      const cashierId = user?.id || 1;
      const cashierName = user?.name || 'Kasir';
      await openShift(cashierId, cashierName, cash);
      setOpeningCashInput('');
      loadShifts();
      alert('Shift baru berhasil dibuka!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal membuka shift');
    }
  };

  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;

    const actual = Number(actualCashInput) || 0;
    const confirmClose = window.confirm('Apakah Anda yakin ingin menutup shift ini? Semua penjualan untuk shift ini akan dikunci.');
    if (!confirmClose) return;

    try {
      await closeShift(activeShift.id, actual);
      setActualCashInput('');
      loadShifts();
      alert('Shift berhasil ditutup!');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Gagal menutup shift');
    }
  };

  // Real-time calculation helpers
  const actualCash = Number(actualCashInput) || 0;
  const expectedCash = activeStats?.expectedCash ?? 0;
  const diff = actualCash - expectedCash;

  return (
    <div className="flex h-full bg-surface-950 p-6 gap-6 overflow-y-auto">
      {/* Left Panel — Active Shift Control */}
      <div className="flex flex-col w-1/2 space-y-6">
        {/* Active Shift Card */}
        <div className="bg-surface-900 border border-surface-700/80 rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-2 border-b border-surface-700/80 pb-3 mb-4">
            <ClockIcon size={20} className="text-primary-600" />
            <h2 className="text-base font-bold text-surface-100">Shift Kasir Aktif</h2>
          </div>

          {isLoading && !activeShift ? (
            <div className="h-48 flex items-center justify-center">
              <span className="inline-block w-8 h-8 border-4 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : activeShift ? (
            // ACTIVE SHIFT
            <div className="space-y-5 animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="block text-[10px] text-surface-400 font-bold uppercase tracking-wider">Kasir</span>
                  <span className="font-bold text-sm text-surface-100">{activeShift.cashier_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-surface-400 font-bold uppercase tracking-wider">Dibuka Pada</span>
                  <span className="font-semibold text-sm text-surface-100">{formatDate(activeShift.opened_at)}</span>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="bg-surface-950 border border-surface-700/80 rounded-xl p-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-surface-400 font-medium">Modal Kas Awal</span>
                  <span className="text-surface-200 font-bold">{formatRupiah(activeShift.opening_cash)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-surface-400 font-medium">Penjualan Tunai</span>
                  <span className="text-surface-200 font-bold">{formatRupiah(activeStats?.cashSales ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center pt-2.5 border-t border-surface-700/80">
                  <span className="text-sm font-bold text-surface-300">Total Kas Diharapkan</span>
                  <span className="text-lg font-extrabold text-primary-600">{formatRupiah(expectedCash)}</span>
                </div>
              </div>

              {/* Close Shift Form */}
              <form onSubmit={handleCloseShift} className="space-y-4 border-t border-surface-700/80 pt-4">
                <div className="space-y-2">
                  <label htmlFor="actual-cash-input" className="block text-xs font-bold text-surface-300 uppercase tracking-wider">
                    Jumlah Kas Aktual di Laci
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-surface-400">Rp</span>
                    <input
                      id="actual-cash-input"
                      type="text"
                      value={actualCashInput}
                      onChange={(e) => setActualCashInput(e.target.value.replace(/[^0-9]/g, ''))}
                      placeholder="0"
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-900 border border-surface-700/80 font-bold text-surface-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all text-base"
                      required
                    />
                  </div>
                </div>

                {/* Diff Calculation Visual */}
                {actualCashInput.length > 0 && (
                  <div className={`p-3 rounded-xl border text-sm font-semibold flex justify-between ${
                    diff === 0 
                      ? 'bg-success-50 border-success-200 text-success-700' 
                      : diff > 0 
                      ? 'bg-primary-50 border-primary-200 text-primary-700' 
                      : 'bg-danger-50 border-danger-200 text-danger-700'
                  }`}>
                    <span>Selisih:</span>
                    <span>
                      {diff === 0 ? 'Cocok (Pas)' : diff > 0 ? `Kelebihan ${formatRupiah(diff)}` : `Kekurangan ${formatRupiah(diff)}`}
                    </span>
                  </div>
                )}

                <button
                  id="btn-close-shift"
                  type="submit"
                  className="w-full py-3.5 bg-danger-600 hover:bg-danger-500 text-white font-bold rounded-xl transition-all shadow-xs active:scale-95 text-sm"
                >
                  Tutup Shift Kasir
                </button>
              </form>
            </div>
          ) : (
            // OPEN SHIFT FORM
            <form onSubmit={handleOpenShift} className="space-y-4 animate-fade-in">
              <p className="text-sm text-surface-400 leading-relaxed">
                Laci kasir saat ini tutup. Silakan masukkan uang modal kas awal Anda untuk membuka shift penjualan baru.
              </p>
              <div className="space-y-2">
                <label htmlFor="opening-cash-input" className="block text-xs font-bold text-surface-300 uppercase tracking-wider">
                  Uang Kas Awal (Modal)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-surface-400">Rp</span>
                  <input
                    id="opening-cash-input"
                    type="text"
                    value={openingCashInput}
                    onChange={(e) => setOpeningCashInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-900 border border-surface-700/80 font-bold text-surface-100 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/15 transition-all text-base"
                    required
                    autoFocus
                  />
                </div>
              </div>
              <button
                id="btn-open-shift"
                type="submit"
                className="w-full py-3.5 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-md shadow-primary-600/20 active:scale-95 text-sm"
              >
                Buka Shift Baru
              </button>
            </form>
          )}

          {error && (
            <div className="mt-4 px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-xs font-semibold flex items-center gap-2">
              <AlertTriangleIcon size={16} className="text-danger-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel — Shift History List */}
      <div className="flex-1 bg-surface-900 border border-surface-700/80 rounded-2xl p-6 shadow-card flex flex-col overflow-hidden max-h-[85vh]">
        <div className="border-b border-surface-700/80 pb-3">
          <h2 className="text-base font-bold text-surface-100">Riwayat Shift</h2>
          <p className="text-xs text-surface-400 mt-0.5">Daftar shift kasir yang tersimpan secara lokal</p>
        </div>

        <div className="flex-1 overflow-y-auto mt-4 space-y-3">
          {shifts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-surface-400">
              <ClockIcon size={40} className="mb-2 stroke-1 text-surface-400" />
              <p className="text-sm font-medium">Belum ada riwayat shift</p>
            </div>
          ) : (
            shifts.map((s) => {
              const diffVal = (s.closing_cash ?? 0) - (s.expected_cash ?? 0);
              return (
                <div
                  key={s.id}
                  className="p-4 rounded-xl bg-surface-950 border border-surface-700/80 text-xs space-y-2 hover:border-surface-600 transition-colors"
                >
                  <div className="flex justify-between font-bold text-sm">
                    <span className="text-surface-100">{s.cashier_name}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      s.status === 'OPEN' 
                        ? 'bg-primary-50 text-primary-700 border border-primary-200' 
                        : 'bg-surface-800 text-surface-400 border border-surface-700'
                    }`}>
                      {s.status === 'OPEN' ? 'Aktif' : 'Tutup'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-1 text-surface-400">
                    <span>Dibuka:</span>
                    <span className="text-right text-surface-300 font-medium">{formatDate(s.opened_at)}</span>
                    {s.closed_at && (
                      <>
                        <span>Ditutup:</span>
                        <span className="text-right text-surface-300 font-medium">{formatDate(s.closed_at)}</span>
                      </>
                    )}
                  </div>

                  <div className="border-t border-surface-700/80 pt-2 flex justify-between">
                    <div className="text-center">
                      <span className="block text-[9px] text-surface-400 uppercase font-bold">Modal Awal</span>
                      <span className="font-bold text-surface-200">{formatRupiah(s.opening_cash)}</span>
                    </div>
                    {s.status === 'CLOSED' && (
                      <>
                        <div className="text-center">
                          <span className="block text-[9px] text-surface-400 uppercase font-bold">Diharapkan</span>
                          <span className="font-bold text-surface-200">{formatRupiah(s.expected_cash ?? 0)}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[9px] text-surface-400 uppercase font-bold">Aktual</span>
                          <span className="font-bold text-surface-200">{formatRupiah(s.closing_cash ?? 0)}</span>
                        </div>
                        <div className="text-center">
                          <span className="block text-[9px] text-surface-400 uppercase font-bold">Selisih</span>
                          <span className={`font-bold ${
                            diffVal === 0 
                              ? 'text-success-600' 
                              : diffVal > 0 
                              ? 'text-primary-600' 
                              : 'text-danger-600'
                          }`}>
                            {diffVal === 0 ? 'Pas' : formatRupiah(diffVal)}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
