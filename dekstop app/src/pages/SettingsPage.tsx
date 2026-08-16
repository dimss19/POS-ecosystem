/**
 * KASIR POS — Settings Page
 *
 * View and configure application endpoints, printer sizes, and sync parameters.
 */

import { useEffect, useState } from 'react';
import { getSetting, setSetting } from '../services/database';
import { getDeviceId } from '../services/transaction';

export default function SettingsPage() {
  const [serverUrl, setServerUrl] = useState('');
  const [paperSize, setPaperSize] = useState('80');
  const [syncInterval, setSyncInterval] = useState('300');
  const [deviceId, setDeviceId] = useState('');
  const [storeName, setStoreName] = useState('KASIR POS');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const url = await getSetting('server_url');
      const paper = await getSetting('printer_paper_size');
      const interval = await getSetting('sync_interval_seconds');
      const store = await getSetting('store_name');
      const devId = await getDeviceId();

      if (url) setServerUrl(url);
      if (paper) setPaperSize(paper);
      if (interval) setSyncInterval(interval);
      if (store) setStoreName(store);
      setDeviceId(devId);
    };

    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await setSetting('server_url', serverUrl);
      await setSetting('printer_paper_size', paperSize);
      await setSetting('sync_interval_seconds', syncInterval);
      await setSetting('store_name', storeName);

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      alert('Gagal menyimpan pengaturan: ' + (err instanceof Error ? err.message : 'Error'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface-950 p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-surface-700/50 pb-4">
        <div>
          <h2 className="text-xl font-bold text-surface-100">Pengaturan Aplikasi</h2>
          <p className="text-xs text-surface-400 mt-0.5">Konfigurasi endpoint API, printer kasir, dan info perangkat</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="max-w-2xl bg-surface-900 border border-surface-700/50 rounded-2xl p-6 shadow-card space-y-6">
        
        {/* Device Information (Read Only) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-surface-300 uppercase tracking-wider">Informasi Perangkat</h3>
          <div className="bg-surface-950 border border-surface-850 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-surface-500">ID Perangkat</span>
              <span className="font-mono font-bold text-surface-200">{deviceId}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-surface-500">Tipe Perangkat</span>
              <span className="font-semibold text-surface-200">Kasir Windows Desktop</span>
            </div>
          </div>
        </div>

        {/* Store Profile */}
        <div className="space-y-4 border-t border-surface-800 pt-4">
          <h3 className="text-sm font-bold text-surface-300 uppercase tracking-wider">Profil Toko</h3>
          <div className="space-y-2">
            <label htmlFor="store-name-input" className="block text-xs font-semibold text-surface-400">Nama Toko</label>
            <input
              id="store-name-input"
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-sm text-surface-100 placeholder-surface-500 focus:border-primary-500 outline-none"
              required
            />
          </div>
        </div>

        {/* Server API Connection */}
        <div className="space-y-4 border-t border-surface-800 pt-4">
          <h3 className="text-sm font-bold text-surface-300 uppercase tracking-wider">Koneksi Server</h3>
          <div className="space-y-2">
            <label htmlFor="server-url-input" className="block text-xs font-semibold text-surface-400">URL Server Backend</label>
            <input
              id="server-url-input"
              type="url"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-sm text-surface-100 placeholder-surface-500 focus:border-primary-500 outline-none font-mono"
              required
            />
          </div>
        </div>

        {/* Sync Settings */}
        <div className="space-y-4 border-t border-surface-800 pt-4">
          <h3 className="text-sm font-bold text-surface-300 uppercase tracking-wider">Sinkronisasi</h3>
          <div className="space-y-2">
            <label htmlFor="sync-interval-input" className="block text-xs font-semibold text-surface-400">Interval Autosync (Detik)</label>
            <input
              id="sync-interval-input"
              type="text"
              value={syncInterval}
              onChange={(e) => setSyncInterval(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="300"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-sm text-surface-100 focus:border-primary-500 outline-none"
              required
            />
          </div>
        </div>

        {/* Printer Configuration */}
        <div className="space-y-4 border-t border-surface-800 pt-4">
          <h3 className="text-sm font-bold text-surface-300 uppercase tracking-wider">Printer Thermal</h3>
          <div className="space-y-2">
            <label htmlFor="paper-size-select" className="block text-xs font-semibold text-surface-400">Ukuran Kertas Struk</label>
            <select
              id="paper-size-select"
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-800 border border-surface-700 text-sm text-surface-200 outline-none focus:border-primary-500"
            >
              <option value="58">58mm (Kertas Kecil / Handheld)</option>
              <option value="80">80mm (Kertas Standar / Desktop)</option>
            </select>
          </div>
        </div>

        {/* Save confirmation */}
        {saveSuccess && (
          <div className="px-4 py-3 rounded-lg bg-success-500/10 border border-success-500/30 text-success-400 text-sm animate-fade-in">
            ✓ Pengaturan berhasil disimpan!
          </div>
        )}

        {/* Action Button */}
        <div className="border-t border-surface-800 pt-4 flex justify-end">
          <button
            id="btn-save-settings"
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
          </button>
        </div>

      </form>
    </div>
  );
}
