/**
 * KASIR POS — Cart Store (Zustand)
 *
 * Manages the shopping cart state.
 * All price calculations are done with proper rounding.
 */

import { create } from 'zustand';
import type { CartItem } from '../types';

interface CartState {
  items: CartItem[];
  discount: number;

  addItem: (product: { product_id: number; product_name: string; barcode: string; price: number; stock: number }) => void;
  increaseQuantity: (productId: number) => void;
  decreaseQuantity: (productId: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
  setDiscount: (discount: number) => void;

  getSubtotal: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  discount: 0,

  addItem: (product) => {
    const { items } = get();
    const existing = items.find((i) => i.product_id === product.product_id);

    if (existing) {
      // Check stock before increasing
      if (existing.quantity >= product.stock) return;

      set({
        items: items.map((i) =>
          i.product_id === product.product_id
            ? {
                ...i,
                quantity: i.quantity + 1,
                subtotal: Math.round((i.quantity + 1) * i.price * 100) / 100,
              }
            : i,
        ),
      });
    } else {
      if (product.stock <= 0) return;

      set({
        items: [
          ...items,
          {
            product_id: product.product_id,
            product_name: product.product_name,
            barcode: product.barcode,
            price: product.price,
            quantity: 1,
            subtotal: product.price,
          },
        ],
      });
    }
  },

  increaseQuantity: (productId: number) => {
    set({
      items: get().items.map((i) =>
        i.product_id === productId
          ? {
              ...i,
              quantity: i.quantity + 1,
              subtotal: Math.round((i.quantity + 1) * i.price * 100) / 100,
            }
          : i,
      ),
    });
  },

  decreaseQuantity: (productId: number) => {
    const { items } = get();
    const item = items.find((i) => i.product_id === productId);
    if (!item) return;

    if (item.quantity <= 1) {
      set({ items: items.filter((i) => i.product_id !== productId) });
    } else {
      set({
        items: items.map((i) =>
          i.product_id === productId
            ? {
                ...i,
                quantity: i.quantity - 1,
                subtotal: Math.round((i.quantity - 1) * i.price * 100) / 100,
              }
            : i,
        ),
      });
    }
  },

  removeItem: (productId: number) => {
    set({ items: get().items.filter((i) => i.product_id !== productId) });
  },

  clearCart: () => {
    set({ items: [], discount: 0 });
  },

  setDiscount: (discount: number) => {
    set({ discount: Math.max(0, discount) });
  },

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.subtotal, 0);
  },

  getTotal: () => {
    const subtotal = get().getSubtotal();
    const discount = get().discount;
    return Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
