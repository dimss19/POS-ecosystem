/**
 * KASIR POS — Checkout Modal Component
 *
 * Handles checkout payment method selection, amount paid inputs, change calculation,
 * validation, and final transaction submission.
 */

import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useAuthStore } from '../../stores/authStore';
import { formatRupiah } from '../../utils/format';
import type { PaymentMethod } from '../../types';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const QUICK_CASH_VALUES = [10000, 20000, 50000, 100000, 200000];

export default function CheckoutModal({ isOpen, onClose, onSuccess }: CheckoutModalProps) {
  const { items, discount, getSubtotal, getTotal, clearCart } = useCartStore();
  const { createTransaction, isLoading, error } = useTransactionStore();
  const { user } = useAuthStore();

  const total = getTotal();
  const subtotal = getSubtotal();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus amount input on open
  useEffect(() => {
    if (isOpen) {
      setPaymentMethod('CASH');
      setAmountPaid(0);
      setInputVal('');
      setCheckoutError(null);
      // Default amount paid to exact total for Transfer/QRIS
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Adjust amount paid when payment method changes
  useEffect(() => {
    if (paymentMethod !== 'CASH') {
      setAmountPaid(total);
      setInputVal(total.toString());
    } else {
      setAmountPaid(0);
      setInputVal('');
    }
  }, [paymentMethod, total]);

  if (!isOpen) return null;

  const change = Math.max(0, amountPaid - total);
  const isInsufficient = paymentMethod === 'CASH' && amountPaid < total;

  const handleAmountChange = (val: string) => {
    // Sanitasi input, biarkan hanya angka
    const cleanVal = val.replace(/[^0-9]/g, '');
    setInputVal(cleanVal);
    setAmountPaid(Number(cleanVal) || 0);
  };

  const handleQuickCash = (val: number) => {
    setAmountPaid(val);
    setInputVal(val.toString());
  };

  const handleCheckoutSubmit = async () => {
    if (isInsufficient) {
      setCheckoutError('Uang pembayaran kurang!');
      return;
    }

    try {
      setCheckoutError(null);
      
      // Shift ID check fallback to 1 until Part 7 is implemented
      const shiftId = 1;
      const cashierId = user?.id || 1;
      const cashierName = user?.name || 'Kasir';

      await createTransaction({
        shiftId,
        cashierId,
        cashierName,
        subtotal,
        discount,
        total,
        paymentMethod,
        amountPaid,
        change,
        items: items.map(i => ({
          product_id: i.product_id,
          product_name: i.product_name,
          barcode: i.barcode,
          price: i.price,
          quantity: i.quantity,
          subtotal: i.subtotal
        }))
      });

      clearCart();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Gagal memproses transaksi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      {/* Modal Container */}
      <div className="w-full max-w-2xl bg-surface-900 border border-surface-700/50 rounded-2xl overflow-hidden shadow-modal animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/50">
          <h3 className="text-lg font-bold text-surface-100">Pembayaran Kasir</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-surface-400 hover:text-surface-200 transition-colors text-xl font-medium"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Total Display */}
          <div className="bg-surface-950 rounded-xl p-4 flex justify-between items-center border border-surface-800">
            <span className="text-sm font-semibold text-surface-400 uppercase tracking-wider">Total Tagihan</span>
            <span className="text-3xl font-extrabold text-primary-400">{formatRupiah(total)}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-surface-300">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-3">
              {(['CASH', 'TRANSFER', 'QRIS'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${
                    paymentMethod === method
                      ? 'border-primary-500 bg-primary-600/10 text-primary-300'
                      : 'border-surface-700 bg-surface-800 text-surface-400 hover:border-surface-600 hover:text-surface-200'
                  }`}
                >
                  <span className="text-2xl mb-1">
                    {method === 'CASH' ? '💵' : method === 'TRANSFER' ? '🏦' : '📱'}
                  </span>
                  <span className="text-sm font-bold">{method}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Input Details */}
          {paymentMethod === 'CASH' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Cash Input */}
              <div className="space-y-3">
                <label htmlFor="amount-paid-input" className="block text-sm font-semibold text-surface-300">
                  Uang Diterima
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-surface-500">Rp</span>
                  <input
                    ref={inputRef}
                    id="amount-paid-input"
                    type="text"
                    value={inputVal}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-4 rounded-xl bg-surface-800 border-2 border-surface-700 text-2xl font-bold text-surface-100 outline-none focus:border-primary-500 transition-colors"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Change Calculation */}
              <div className="space-y-3">
                <span className="block text-sm font-semibold text-surface-300">Kembalian</span>
                <div className={`w-full py-4 px-6 rounded-xl border-2 flex items-center justify-between ${
                  isInsufficient 
                    ? 'bg-danger-500/5 border-danger-500/20 text-danger-400' 
                    : 'bg-success-500/5 border-success-500/20 text-success-400'
                }`}>
                  <span className="text-sm font-medium">
                    {isInsufficient ? 'Kurang Pembayaran' : 'Jumlah Kembalian'}
                  </span>
                  <span className="text-2xl font-extrabold">
                    {formatRupiah(isInsufficient ? total - amountPaid : change)}
                  </span>
                </div>
              </div>

              {/* Quick Cash Option */}
              <div className="md:col-span-2 space-y-3">
                <span className="block text-sm font-semibold text-surface-400">Pilihan Uang Cepat</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    className="px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-xs font-bold text-surface-200 hover:border-primary-500 transition-all active:scale-95"
                  >
                    Uang Pas
                  </button>
                  {QUICK_CASH_VALUES.filter(val => val > total).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickCash(val)}
                      className="px-4 py-2.5 rounded-lg bg-surface-800 border border-surface-700 text-xs font-bold text-surface-200 hover:border-primary-500 transition-all active:scale-95"
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Transfer/QRIS non-editable summary
            <div className="bg-surface-800 rounded-xl p-4 border border-surface-700/50 space-y-2">
              <p className="text-sm text-surface-400">
                Pilih metode non-tunai. Jumlah tagihan akan dicatat persis sebesar total pembayaran:
              </p>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold text-surface-200">Uang Diterima</span>
                <span className="text-lg font-bold text-surface-100">{formatRupiah(total)}</span>
              </div>
            </div>
          )}

          {/* Validation & Store Errors */}
          {(checkoutError || error) && (
            <div className="px-4 py-3 rounded-lg bg-danger-500/10 border border-danger-500/30 text-danger-400 text-sm animate-fade-in">
              {checkoutError || error}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-surface-700/50 flex gap-3 bg-surface-950">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-surface-800 border border-surface-700 text-surface-300 font-semibold hover:bg-surface-700 transition-colors"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            id="checkout-confirm"
            type="button"
            onClick={handleCheckoutSubmit}
            disabled={isLoading || isInsufficient}
            className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-success-500 to-success-600 text-white font-bold hover:from-success-400 hover:to-success-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg active:scale-[0.98]"
          >
            {isLoading ? 'Memproses...' : 'Konfirmasi Pembayaran'}
          </button>
        </div>
      </div>
    </div>
  );
}
