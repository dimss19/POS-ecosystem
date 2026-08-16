import { useState, useEffect, useRef } from 'react';
import { useCartStore } from '../../stores/cartStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useAuthStore } from '../../stores/authStore';
import { useShiftStore } from '../../stores/shiftStore';
import { formatRupiah } from '../../utils/format';
import { printReceipt } from '../../services/printer';
import {
  XIcon,
  BanknoteIcon,
  BuildingIcon,
  SmartphoneIcon,
  AlertTriangleIcon,
} from '../icons';
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
  const { activeShift } = useShiftStore();

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

    if (!activeShift) {
      setCheckoutError('Tidak ada shift aktif! Silakan buka shift terlebih dahulu.');
      return;
    }

    try {
      setCheckoutError(null);
      
      const shiftId = activeShift.id;
      const cashierId = user?.id || activeShift.cashier_id || 1;
      const cashierName = user?.name || activeShift.cashier_name || 'Kasir';

      const tx = await createTransaction({
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

      // Attempt automatic print receipt (failsafe)
      try {
        const formattedItems = items.map((i, idx) => ({
          id: idx,
          transaction_id: tx.id,
          product_id: i.product_id,
          product_name: i.product_name,
          price: i.price,
          quantity: i.quantity,
          subtotal: i.subtotal,
          created_at: tx.created_at
        }));
        await printReceipt(tx, formattedItems);
      } catch {
        // Printer failure must NOT invalidate transaction
        console.warn('Printer failure. Receipt was not printed automatically.');
      }

      clearCart();
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setCheckoutError(err instanceof Error ? err.message : 'Gagal memproses transaksi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
      {/* Modal Container */}
      <div className="w-full max-w-2xl bg-surface-900 border border-surface-700/80 rounded-2xl overflow-hidden shadow-modal animate-scale-in flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-700/80 bg-surface-900">
          <h3 className="text-base font-bold text-surface-100">Pembayaran Kasir</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors"
            disabled={isLoading}
          >
            <XIcon size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Total Display */}
          <div className="bg-surface-950 rounded-xl p-4 flex justify-between items-center border border-surface-700/80">
            <span className="text-xs font-bold text-surface-400 uppercase tracking-wider">Total Tagihan</span>
            <span className="text-3xl font-extrabold text-primary-600">{formatRupiah(total)}</span>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-surface-400 uppercase tracking-wider">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-3">
              {(['CASH', 'TRANSFER', 'QRIS'] as PaymentMethod[]).map((method) => {
                const isSelected = paymentMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-150 ${
                      isSelected
                        ? 'border-primary-500 bg-primary-50 text-primary-700 font-bold shadow-xs'
                        : 'border-surface-700/80 bg-surface-900 text-surface-400 hover:border-surface-600 hover:text-surface-200 shadow-2xs'
                    }`}
                  >
                    <span className="mb-2">
                      {method === 'CASH' ? (
                        <BanknoteIcon size={24} />
                      ) : method === 'TRANSFER' ? (
                        <BuildingIcon size={24} />
                      ) : (
                        <SmartphoneIcon size={24} />
                      )}
                    </span>
                    <span className="text-xs font-bold">{method}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Payment Input Details */}
          {paymentMethod === 'CASH' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Cash Input */}
              <div className="space-y-2">
                <label htmlFor="amount-paid-input" className="block text-xs font-bold text-surface-400 uppercase tracking-wider">
                  Uang Diterima
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-surface-400">Rp</span>
                  <input
                    ref={inputRef}
                    id="amount-paid-input"
                    type="text"
                    value={inputVal}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-surface-900 border-2 border-surface-700/80 text-xl font-bold text-surface-100 outline-none focus:border-primary-500 transition-colors shadow-2xs"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Change Calculation */}
              <div className="space-y-2">
                <span className="block text-xs font-bold text-surface-400 uppercase tracking-wider">Kembalian</span>
                <div className={`w-full py-3 px-4 rounded-xl border-2 flex items-center justify-between ${
                  isInsufficient 
                    ? 'bg-danger-50 border-danger-200 text-danger-700' 
                    : 'bg-success-50 border-success-200 text-success-700'
                }`}>
                  <span className="text-xs font-semibold">
                    {isInsufficient ? 'Kurang Bayar' : 'Kembalian'}
                  </span>
                  <span className="text-xl font-extrabold">
                    {formatRupiah(isInsufficient ? total - amountPaid : change)}
                  </span>
                </div>
              </div>

              {/* Quick Cash Option */}
              <div className="md:col-span-2 space-y-2">
                <span className="block text-xs font-bold text-surface-400 uppercase tracking-wider">Pilihan Uang Cepat</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    className="px-3.5 py-2 rounded-lg bg-surface-900 border border-surface-700 text-xs font-bold text-surface-300 hover:border-primary-500 hover:text-primary-600 transition-all active:scale-95 shadow-2xs"
                  >
                    Uang Pas
                  </button>
                  {QUICK_CASH_VALUES.filter(val => val > total).map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickCash(val)}
                      className="px-3.5 py-2 rounded-lg bg-surface-900 border border-surface-700 text-xs font-bold text-surface-300 hover:border-primary-500 hover:text-primary-600 transition-all active:scale-95 shadow-2xs"
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Transfer/QRIS non-editable summary
            <div className="bg-surface-950 rounded-xl p-4 border border-surface-700/80 space-y-2">
              <p className="text-xs text-surface-400">
                Pilih metode non-tunai. Jumlah tagihan akan dicatat persis sebesar total pembayaran:
              </p>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-semibold text-surface-300">Uang Diterima</span>
                <span className="text-lg font-bold text-surface-100">{formatRupiah(total)}</span>
              </div>
            </div>
          )}

          {/* Validation & Store Errors */}
          {(checkoutError || error) && (
            <div className="px-4 py-3 rounded-xl bg-danger-50 border border-danger-200 text-danger-700 text-xs font-semibold animate-fade-in flex items-center gap-2">
              <AlertTriangleIcon size={16} className="text-danger-600 shrink-0" />
              <span>{checkoutError || error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-surface-700/80 flex gap-3 bg-surface-950">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 px-4 rounded-xl bg-surface-900 border border-surface-700 text-surface-300 font-semibold hover:bg-surface-800 transition-colors text-sm shadow-2xs"
            disabled={isLoading}
          >
            Batal
          </button>
          <button
            id="checkout-confirm"
            type="button"
            onClick={handleCheckoutSubmit}
            disabled={isLoading || isInsufficient}
            className="flex-1 py-3 px-4 rounded-xl bg-success-600 text-white font-bold hover:bg-success-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-md active:scale-[0.98] text-sm"
          >
            {isLoading ? 'Memproses Transaksi...' : 'Konfirmasi Pembayaran'}
          </button>
        </div>
      </div>
    </div>
  );
}
