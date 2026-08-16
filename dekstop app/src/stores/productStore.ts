/**
 * KASIR POS — Product Store (Zustand)
 */

import { create } from 'zustand';
import type { Product, Category } from '../types';
import * as productService from '../services/product';

interface ProductState {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  selectedCategoryId: number | null;
  isLoading: boolean;

  loadProducts: () => Promise<void>;
  loadCategories: () => Promise<void>;
  searchProducts: (query: string) => Promise<void>;
  setCategory: (categoryId: number | null) => Promise<void>;
  findByBarcode: (barcode: string) => Promise<Product | null>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  categories: [],
  searchQuery: '',
  selectedCategoryId: null,
  isLoading: false,

  loadProducts: async () => {
    set({ isLoading: true });
    const { selectedCategoryId } = get();
    const products = await productService.getProducts(
      selectedCategoryId ?? undefined,
    );
    set({ products, isLoading: false });
  },

  loadCategories: async () => {
    const categories = await productService.getCategories();
    set({ categories });
  },

  searchProducts: async (query: string) => {
    set({ searchQuery: query, isLoading: true });
    if (!query.trim()) {
      const { selectedCategoryId } = get();
      const products = await productService.getProducts(
        selectedCategoryId ?? undefined,
      );
      set({ products, isLoading: false });
      return;
    }
    const products = await productService.searchProducts(query);
    set({ products, isLoading: false });
  },

  setCategory: async (categoryId: number | null) => {
    set({ selectedCategoryId: categoryId, isLoading: true });
    const products = await productService.getProducts(
      categoryId ?? undefined,
    );
    set({ products, isLoading: false });
  },

  findByBarcode: async (barcode: string) => {
    return productService.getProductByBarcode(barcode);
  },
}));
